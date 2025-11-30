import React, {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { auth } from "../../firebase/config";
import {
  deleteReview,
  getReviewByUserId,
  recallReviewMessage,
  userReply,
  type Message,
  type Review,
} from "../../api/reviewApi";
import { uploadToCloudinary } from "../../api/uploadToCloudinary";
import { socket } from "../../utils/socket";

interface Trip {
  tenChuyen: string;
  tuTinh?: string;
  denTinh?: string;
  nhaXe?: string;
  ngayKhoiHanh?: string;
  gioKhoiHanh?: string;
}

interface Booking {
  _id: string;
  tripId?: Trip;
  hoTen?: string;
  sdt?: string;
  email?: string;
  soGhe: number[];
  diemDonChiTiet?: string;
  diemTraChiTiet?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  qrCode?: string;
  seatPrice?: number;
  totalPrice: number;
  finalTotal?: number;
  createdAt?: string;
}

interface ReviewType extends Omit<Review, "createdAt"> {
  booking?: Booking;
  messages?: Message[];
  reply?: string;
  tenChuyen?: string;
  hoTen?: string;
  sdt?: string;
  ngayKhoiHanh?: string;
  gioKhoiHanh?: string;
  soGhe?: number[];
  totalPrice?: number;
  createdAt?: string;
}

type FilterKey = "all" | "comment" | "image" | "reply";

type FilterCounts = Record<FilterKey, number>;

interface InsightCard {
  key: FilterKey;
  label: string;
  value: number;
  percent: number;
  icon: string;
  accent: string;
  subtitle: string;
}

const filterDefinitions: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "comment", label: "Có nhận xét" },
  { key: "image", label: "Có hình ảnh" },
  { key: "reply", label: "Đã trao đổi" },
];

const palette = {
  background: "",
  surface: "#e6f3f5ff",
  surfaceAlt: "#c4cfdbff",
  border: "#9ed6adff",
  text: "#0f172a",
  muted: "#010c04ff",
  primary: "#0ea5e9",
  primaryDark: "#2563eb",
  accent: "#38bdf8",
};

const avatarColors = ["#0ea5e9", "#f97316", "#22c55e", "#6366f1", "#ec4899", "#14b8a6"];

const ratingCategoryLabels = [
  "An toàn",
  "Thái độ nhân viên",
  "Tiện nghi & dịch vụ",
  "Đúng giờ đón/trả",
  "Chất lượng ghế",
];

const getRatingAccent = (value?: number) => {
  if (!value) return palette.primary;
  if (value >= 4.5) return "#22c55e";
  if (value >= 4) return "#0ea5e9";
  if (value >= 3) return "#f97316";
  return "#ef4444";
};

const fmtDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "";

const avatarPalette = (seed: string) => {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatCurrency = (value?: number) =>
  typeof value === "number" && !Number.isNaN(value) ? currencyFormatter.format(value) : "";

export default function Review(): React.ReactElement {
  const [uid, setUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const [inputMap, setInputMap] = useState<Record<string, string>>({});
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
  const [recallMap, setRecallMap] = useState<Record<string, boolean>>({});
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({});

  const mountedRef = useRef(true);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTargetRef = useRef<{ reviewId: string; message: Message } | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!mountedRef.current) return;
      setUid(user?.uid || null);
      setDisplayName(user?.displayName || user?.email || "Người dùng");
      setUserAvatar(user?.photoURL || "");

      if (user && socket?.connected) {
        socket.emit("registerUser", user.uid);
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!uid) return;

    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getReviewByUserId(uid);
        if (!ignore && mountedRef.current) {
          setReviews(data || []);
        }
      } catch (error) {
        console.error("Không thể tải đánh giá:", error);
      } finally {
        if (!ignore && mountedRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [uid]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const ratingAverage = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  const ratingDistribution = useMemo(() => {
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((review) => Math.round(review.rating || 0) === star).length;
      return {
        star,
        count,
        percent: total ? (count / total) * 100 : 0,
      };
    });
  }, [reviews]);

  const filterCounts = useMemo<FilterCounts>(() => {
    const base: FilterCounts = {
      all: reviews.length,
      comment: 0,
      image: 0,
      reply: 0,
    };

    reviews.forEach((review) => {
      if ((review.comment || "").trim().length > 0) base.comment += 1;
      if (review.imageUrl) base.image += 1;
      if (review.reply || (review.messages?.length ?? 0) > 0) base.reply += 1;
    });

    return base;
  }, [reviews]);

  const filterOptions = useMemo(
    () => filterDefinitions.map((option) => ({ ...option, count: filterCounts[option.key] })),
    [filterCounts]
  );

  const insightCards = useMemo<InsightCard[]>(() => {
    if (!reviews.length) return [];
    const total = reviews.length;
    const toPercent = (value: number) => Math.round((value / total) * 100);
    return [
      {
        key: "comment",
        label: "Có nhận xét",
        value: filterCounts.comment,
        percent: toPercent(filterCounts.comment),
        icon: "💬",
        accent: palette.primary,
        subtitle: "Nhận xét chi tiết",
      },
      {
        key: "image",
        label: "Có hình ảnh",
        value: filterCounts.image,
        percent: toPercent(filterCounts.image),
        icon: "📷",
        accent: "#f97316",
        subtitle: "Chia sẻ trải nghiệm",
      },
      {
        key: "reply",
        label: "Đã trao đổi",
        value: filterCounts.reply,
        percent: toPercent(filterCounts.reply),
        icon: "🤝",
        accent: "#22c55e",
        subtitle: "Có phản hồi hai chiều",
      },
    ];
  }, [filterCounts, reviews.length]);

  const filteredReviews = useMemo(() => {
    if (activeFilter === "all") return reviews;

    return reviews.filter((review) => {
      switch (activeFilter) {
        case "comment":
          return (review.comment || "").trim().length > 0;
        case "image":
          return Boolean(review.imageUrl);
        case "reply":
          return Boolean(review.reply) || (review.messages?.length ?? 0) > 0;
        default:
          return true;
      }
    });
  }, [activeFilter, reviews]);

  const categoryScores = useMemo(
    () =>
      ratingCategoryLabels.map((label) => ({
        label,
        value: reviews.length ? ratingAverage : null,
      })),
    [ratingAverage, reviews.length]
  );

  const clearFileState = (reviewId: string) => {
    setFileMap((prev) => {
      const next = { ...prev };
      delete next[reviewId];
      return next;
    });
    setPreviewMap((prev) => {
      const next = { ...prev };
      delete next[reviewId];
      return next;
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, reviewId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileMap((prev) => ({ ...prev, [reviewId]: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewMap((prev) => ({ ...prev, [reviewId]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (reviewId: string) => {
    clearFileState(reviewId);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!reviewId) return;
    const confirmed = window.confirm("Xoá hoàn toàn đánh giá này?");
    if (!confirmed) return;

    setDeletingMap((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((review) => review._id !== reviewId));
    } catch (error) {
      console.error("Không thể xoá đánh giá:", error);
      alert("Không thể xoá đánh giá. Vui lòng thử lại.");
    } finally {
      setDeletingMap((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
    }
  };

  const canRecallMessage = (message: Message) => {
    if (!uid) return false;
    if (message.sender !== "user") return false;
    if (message.senderId && message.senderId !== uid) return false;
    return true;
  };

  const handleRecallMessage = async (reviewId: string, message: Message) => {
    const messageId = message._id || (message as any)._id;
    if (!messageId) {
      alert("Không thể thu hồi tin nhắn cũ.");
      return;
    }

    const confirmed = window.confirm("Thu hồi tin nhắn này?");
    if (!confirmed) return;

    setRecallMap((prev) => ({ ...prev, [messageId]: true }));

    try {
      await recallReviewMessage(reviewId, messageId, uid || "", message.createdAt);
      setReviews((prev) =>
        prev.map((review) =>
          review._id === reviewId
            ? {
                ...review,
                messages: (review.messages || []).filter((item) => item._id !== messageId),
              }
            : review
        )
      );
    } catch (error) {
      console.error("Thu hồi tin nhắn thất bại:", error);
      alert("Không thể thu hồi tin nhắn. Vui lòng thử lại.");
    } finally {
      setRecallMap((prev) => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
    }
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressTargetRef.current = null;
  };

  const startLongPress = (reviewId: string, message: Message) => {
    if (!canRecallMessage(message)) return;
    cancelLongPress();
    longPressTargetRef.current = { reviewId, message };
    longPressTimerRef.current = setTimeout(() => {
      const target = longPressTargetRef.current;
      cancelLongPress();
      if (target) {
        handleRecallMessage(target.reviewId, target.message);
      }
    }, 600);
  };

  const handleSend = async (reviewId: string) => {
    if (!reviewId || sendingMap[reviewId]) return;

    const messageText = (inputMap[reviewId] || "").trim();
    const attachment = fileMap[reviewId] || null;

    if (!messageText && !attachment) {
      alert("Nhập nội dung hoặc chọn ảnh trước khi gửi.");
      return;
    }

    const targetReview = reviews.find((review) => review._id === reviewId);
    const originalMessages = targetReview?.messages || [];

    const optimisticMessage: Message = {
      sender: "user",
      senderName: displayName || "Bạn",
      text: messageText,
      imageUrl: previewMap[reviewId] || undefined,
      createdAt: new Date().toISOString(),
    };

    setReviews((prev) =>
      prev.map((review) =>
        review._id === reviewId
          ? { ...review, messages: [...originalMessages, optimisticMessage] }
          : review
      )
    );

    setInputMap((prev) => ({ ...prev, [reviewId]: "" }));
    clearFileState(reviewId);
    setSendingMap((prev) => ({ ...prev, [reviewId]: true }));

    try {
      let imageUrl: string | undefined;
      if (attachment) {
        const uploaded = await uploadToCloudinary(attachment);
        if (!uploaded) throw new Error("Upload ảnh thất bại");
        imageUrl = uploaded;
      }

      const updatedReview = await userReply(
        reviewId,
        messageText,
        imageUrl,
        uid || undefined,
        displayName || undefined
      );

      if (!updatedReview) throw new Error("Không nhận được phản hồi từ máy chủ");

      setReviews((prev) =>
        prev.map((review) => (review._id === reviewId ? { ...review, ...updatedReview } : review))
      );

      socket?.emit("review:newMessage", updatedReview);
    } catch (error) {
      console.error("Lỗi gửi phản hồi:", error);
      alert("Không thể gửi phản hồi. Vui lòng thử lại.");
      setReviews((prev) =>
        prev.map((review) =>
          review._id === reviewId ? { ...review, messages: originalMessages } : review
        )
      );
    } finally {
      setSendingMap((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  if (!uid) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.emptyIcon}>🔒</div>
        <h3 style={styles.emptyTitle}>Vui lòng đăng nhập</h3>
        <p style={styles.emptyText}>Đăng nhập để xem và phản hồi đánh giá của bạn.</p>
      </div>
    );
  }

  const averageLabel = ratingAverage.toFixed(1);

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div style={styles.headerIcon}>⭐</div>
          <div style={styles.headerText}>
            <h1 style={styles.pageTitle}>Đánh giá của tôi</h1>
            <p style={styles.pageSubtitle}>Theo dõi phản hồi cho từng chuyến đi đã hoàn thành</p>
          </div>
          <div style={styles.userBadge}>
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={displayName}
                style={styles.userBadgeAvatar}
                onError={(event) => ((event.target as HTMLImageElement).style.display = "none")}
              />
            ) : (
              <div style={styles.userBadgeFallback}>{displayName.charAt(0).toUpperCase()}</div>
            )}
            <div>
              <p style={styles.userBadgeLabel}>Tài khoản</p>
              <p style={styles.userBadgeName}>{displayName}</p>
            </div>
          </div>
        </div>

        {!loading && reviews.length > 0 && (
          <>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryMain}>
                <div>
                  <p style={styles.summaryLabel}>Điểm trung bình</p>
                  <p style={styles.summaryScore}>{averageLabel}</p>
                  <p style={styles.summaryCount}>{reviews.length} đánh giá</p>
                </div>
                <div style={styles.starRow}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <span
                      key={`avg-star-${index}`}
                      style={{
                        ...styles.starIcon,
                        color: index < Math.round(ratingAverage) ? "#facc15" : palette.border,
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div style={styles.summaryDetails}>
                <div style={styles.summaryCategories}>
                  {categoryScores.map((category) => (
                    <div key={category.label} style={styles.categoryCard}>
                      <span style={styles.categoryLabel}>{category.label}</span>
                      <span style={styles.categoryValue}>
                        {typeof category.value === "number" ? category.value.toFixed(1) : "--"}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={styles.distribution}>
                  {ratingDistribution.map((item) => (
                    <div key={item.star} style={styles.distributionRow}>
                      <span style={styles.distributionLabel}>{item.star}★</span>
                      <div style={styles.progressTrack}>
                        <div style={{ ...styles.progressFill, width: `${item.percent}%` }}></div>
                      </div>
                      <span style={styles.distributionCount}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {insightCards.length > 0 && (
              <div style={styles.insightRow}>
                {insightCards.map((card) => (
                  <div key={card.key} style={styles.insightCard}>
                    <div
                      style={{
                        ...styles.insightIcon,
                        backgroundColor: `${card.accent}15`,
                        color: card.accent,
                      }}
                    >
                      {card.icon}
                    </div>
                    <div style={styles.insightContent}>
                      <div style={styles.insightLabel}>{card.label}</div>
                      <div style={styles.insightValueRow}>
                        <span style={styles.insightValue}>{card.value}</span>
                        <span style={styles.insightPercent}>{card.percent}%</span>
                      </div>
                      <div style={styles.insightSubtitle}>{card.subtitle}</div>
                      <div style={styles.insightBar}>
                        <div
                          style={{
                            ...styles.insightBarFill,
                            width: `${card.percent}%`,
                            background: `linear-gradient(135deg, ${card.accent}, ${palette.accent})`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.filterRow}>
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  style={{
                    ...styles.filterBtn,
                    ...(option.key === activeFilter ? styles.filterBtnActive : {}),
                  }}
                  onClick={() => setActiveFilter(option.key)}
                >
                  <span>{option.label}</span>
                  <span style={styles.filterCount}>{option.count}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p>Đang tải...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📝</div>
            <h3 style={styles.emptyTitle}>Chưa có đánh giá</h3>
            <p style={styles.emptyText}>Những đánh giá của bạn sẽ xuất hiện tại đây.</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <h3 style={styles.emptyTitle}>Không có kết quả phù hợp</h3>
            <p style={styles.emptyText}>Thay đổi bộ lọc để xem thêm đánh giá.</p>
          </div>
        ) : (
          <div style={styles.reviewList}>
            {filteredReviews.map((review) => {
              const id = review._id;
              if (!id) return null;

              const booking = review.booking;
              const tripName = booking?.tripId?.tenChuyen || review.tenChuyen || "Chuyến đi";
              const departureCity = booking?.tripId?.tuTinh || review.tu || "";
              const destinationCity = booking?.tripId?.denTinh || review.den || "";
              const routeLabel =
                departureCity && destinationCity ? `${departureCity} → ${destinationCity}` : undefined;
              const departureTime =
                [
                  booking?.tripId?.gioKhoiHanh || review.gioKhoiHanh,
                  booking?.tripId?.ngayKhoiHanh || review.ngayKhoiHanh,
                ]
                  .filter(Boolean)
                  .join(" • ");
              const seatList = booking?.soGhe?.length ? booking.soGhe : review.soGhe;
              const price = booking?.finalTotal ?? booking?.totalPrice ?? review.totalPrice;

              const metaItems = [
                routeLabel ? { label: "Tuyến", value: routeLabel } : null,
                departureTime ? { label: "Khởi hành", value: departureTime } : null,
                seatList && seatList.length
                  ? { label: "Ghế", value: seatList.map((seat) => seat.toString()).join(", ") }
                  : null,
                price ? { label: "Chi phí", value: formatCurrency(price) } : null,
              ].filter((item): item is { label: string; value: string } => Boolean(item && item.value));

              const threadItems: Message[] = [
                ...(review.reply
                  ? [
                      {
                        sender: "partner" as const,
                        senderName: "Nhà xe",
                        text: review.reply,
                        createdAt: review.createdAt,
                      },
                    ]
                  : []),
                ...(review.messages || []),
              ];

              const initials = (review.hoTen || booking?.hoTen || "K").charAt(0).toUpperCase();
              const isSending = sendingMap[id] || false;
              const ratingColor = getRatingAccent(review.rating);

              return (
                <div key={id} style={styles.reviewCard}>
                  <div style={{ ...styles.reviewAccent, background: ratingColor }}></div>
                  {review.userId === uid && (
                    <button
                      type="button"
                      style={{
                        ...styles.deleteBtn,
                        ...(deletingMap[id] ? styles.deleteBtnDisabled : {}),
                      }}
                      onClick={() => handleDeleteReview(id)}
                      disabled={Boolean(deletingMap[id])}
                    >
                      {deletingMap[id] ? "Đang xoá..." : "Xoá đánh giá"}
                    </button>
                  )}
                  <div style={styles.reviewHeader}>
                    <div
                      style={{
                        ...styles.reviewAvatar,
                        backgroundColor: avatarPalette(id),
                      }}
                    >
                      {initials}
                    </div>
                    <div style={styles.reviewInfo}>
                      <div style={styles.reviewTopRow}>
                        <span style={styles.reviewName}>
                          {review.hoTen || booking?.hoTen || "Khách hàng"}
                        </span>
                        <span style={styles.statusChip}>
                          <span style={styles.statusDot}></span>
                          Đã đi
                        </span>
                        <span style={styles.reviewDate}>{fmtDate(review.createdAt)}</span>
                      </div>
                      <div style={styles.reviewTripRow}>
                        <span style={styles.reviewTrip}>{tripName}</span>
                        {routeLabel && (
                          <span style={styles.routeBadge}>
                            <span style={styles.routeDot}></span>
                            {routeLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={styles.reviewRating}>
                      <span
                        style={{
                          ...styles.ratingBadge,
                          color: ratingColor,
                          background: `${ratingColor}12`,
                          borderColor: `${ratingColor}33`,
                        }}
                      >
                        <span style={{ ...styles.ratingBadgeIcon, color: ratingColor }}>★</span>
                        {(review.rating || 0).toFixed(1)}
                      </span>
                      <div style={styles.starRow}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <span
                            key={`${id}-star-${index}`}
                            style={{
                              ...styles.starIcon,
                              color: index < Math.round(review.rating || 0) ? "#facc15" : palette.border,
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {review.comment && <p style={styles.reviewComment}>{review.comment}</p>}

                  {review.imageUrl && (
                    <div style={styles.attachmentsRow}>
                      <img src={review.imageUrl} alt="Ảnh đánh giá" style={styles.reviewImage} />
                    </div>
                  )}

                  {metaItems.length > 0 && (
                    <div style={styles.reviewMetaRow}>
                      {metaItems.map((item) => (
                        <div key={item.label} style={styles.metaChip}>
                          <span style={styles.metaChipLabel}>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {threadItems.length > 0 && (
                    <div style={styles.threadSection}>
                      <div style={styles.threadHeader}>Trao đổi với nhà xe</div>
                      <div style={styles.threadContainer}>
                        {threadItems.map((message, index) => {
                          const key = (message as any)._id || `${id}-thread-${index}`;
                          const messageId = (message as any)._id || message._id;
                          const allowRecall = canRecallMessage(message);
                          const isRecalling = messageId ? recallMap[messageId] : false;
                          const recallHandlers: React.HTMLAttributes<HTMLDivElement> = allowRecall
                            ? {
                                onMouseDown: () => startLongPress(id, message),
                                onMouseUp: cancelLongPress,
                                onMouseLeave: cancelLongPress,
                                onTouchStart: () => startLongPress(id, message),
                                onTouchEnd: cancelLongPress,
                              }
                            : {};

                          return (
                            <div
                              key={key}
                              style={{
                                ...styles.threadCard,
                                ...(allowRecall ? styles.threadCardRecallable : {}),
                                opacity: isRecalling ? 0.5 : 1,
                              }}
                              {...recallHandlers}
                            >
                              <div style={styles.threadMeta}>
                                <div style={styles.threadMetaText}>
                                  <span style={styles.threadSender}>
                                    {message.senderName ||
                                      (message.sender === "user" ? displayName : "Nhà xe")}
                                  </span>
                                  {message.createdAt && (
                                    <span style={styles.threadDate}>{fmtDate(message.createdAt)}</span>
                                  )}
                                </div>
                                {allowRecall && (
                                  <button
                                    type="button"
                                    style={{
                                      ...styles.threadRecallBtn,
                                      ...(isRecalling ? styles.threadRecallBtnDisabled : {}),
                                    }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleRecallMessage(id, message);
                                    }}
                                    disabled={isRecalling}
                                  >
                                    {isRecalling ? "Đang gỡ..." : "Gỡ"}
                                  </button>
                                )}
                              </div>
                              {message.text && <p style={styles.threadText}>{message.text}</p>}
                              {message.imageUrl && (
                                <img src={message.imageUrl} alt="Đính kèm" style={styles.threadImage} />
                              )}
                              {allowRecall && <div style={styles.threadRecallHint}>Giữ để thu hồi</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={styles.composerContainer}>
                    {previewMap[id] && (
                      <div style={styles.previewContainer}>
                        <img src={previewMap[id]} alt="Đính kèm" style={styles.previewImg} />
                        <button style={styles.removePreviewBtn} onClick={() => handleRemoveFile(id)}>
                          ✕
                        </button>
                      </div>
                    )}
                    <div style={styles.inputGroup}>
                      <label
                        htmlFor={`file-${id}`}
                        style={isSending ? styles.attachBtnDisabled : styles.attachBtn}
                      >
                        <input
                          id={`file-${id}`}
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleFileChange(event, id)}
                          disabled={isSending}
                          style={{ display: "none" }}
                        />
                        📎
                      </label>
                      <input
                        style={styles.inputField}
                        value={inputMap[id] ?? ""}
                        placeholder="Nhập phản hồi của bạn..."
                        onChange={(event) => setInputMap((prev) => ({ ...prev, [id]: event.target.value }))}
                        disabled={isSending}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            handleSend(id);
                          }
                        }}
                      />
                      <button
                        style={
                          isSending || (!(inputMap[id] || "").trim() && !fileMap[id])
                            ? styles.sendBtnDisabled
                            : styles.sendBtn
                        }
                        disabled={isSending || (!(inputMap[id] || "").trim() && !fileMap[id])}
                        onClick={() => handleSend(id)}
                      >
                        {isSending ? <div style={styles.miniSpinner}></div> : "Gửi"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    background: palette.background,
    minHeight: "100vh",
    padding: "32px 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: palette.text,
  },
  container: {
    maxWidth: "1740px",
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    alignItems: "center",
    marginBottom: "24px",
  },
  headerIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryDark})`,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
  },
  headerText: {
    flex: 1,
    minWidth: "240px",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: 700,
    margin: "0 0 4px 0",
    color: palette.text,
  },
  pageSubtitle: {
    margin: 0,
    color: palette.muted,
    fontSize: "15px",
  },
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    borderRadius: "999px",
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
  },
  userBadgeAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  userBadgeFallback: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: palette.primary,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
  },
  userBadgeLabel: {
    margin: 0,
    fontSize: "12px",
    color: palette.muted,
  },
  userBadgeName: {
    margin: 0,
    fontWeight: 600,
    color: palette.text,
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
    color: palette.muted,
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: `4px solid ${palette.border}`,
    borderTop: `4px solid ${palette.primaryDark}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  centerContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    background: palette.background,
    color: palette.text,
  },
  emptyState: {
    background: palette.surface,
    borderRadius: "18px",
    padding: "48px 32px",
    textAlign: "center",
    border: `1px solid ${palette.border}`,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyTitle: {
    margin: "0 0 8px 0",
    fontSize: "18px",
    fontWeight: 600,
    color: palette.text,
  },
  emptyText: {
    margin: 0,
    color: palette.muted,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "16px",
    marginBottom: "24px",
  },
  summaryMain: {
    background: palette.surface,
    borderRadius: "18px",
    border: `1px solid ${palette.border}`,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "12px",
  },
  summaryLabel: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: palette.muted,
  },
  summaryScore: {
    fontSize: "48px",
    margin: 0,
    fontWeight: 700,
    color: palette.text,
  },
  summaryCount: {
    margin: 0,
    color: palette.muted,
  },
  summaryDetails: {
    background: palette.surface,
    borderRadius: "18px",
    border: `1px solid ${palette.border}`,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  insightRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  insightCard: {
    display: "flex",
    gap: "16px",
    padding: "20px",
    borderRadius: "18px",
    border: `1px solid ${palette.border}`,
    background: palette.surface,
    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
  },
  insightIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: 600,
  },
  insightContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  insightLabel: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: palette.muted,
  },
  insightValueRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
  },
  insightValue: {
    fontSize: "32px",
    fontWeight: 700,
    color: palette.text,
    lineHeight: 1,
  },
  insightPercent: {
    fontSize: "16px",
    fontWeight: 600,
    color: palette.muted,
  },
  insightSubtitle: {
    fontSize: "13px",
    color: palette.muted,
  },
  insightBar: {
    width: "100%",
    height: "6px",
    borderRadius: "999px",
    background: palette.surfaceAlt,
    border: `1px solid ${palette.border}`,
    overflow: "hidden",
  },
  insightBarFill: {
    height: "100%",
  },
  summaryCategories: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "12px",
  },
  categoryCard: {
    background: palette.surfaceAlt,
    borderRadius: "12px",
    border: `1px solid ${palette.border}`,
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  categoryLabel: {
    fontSize: "12px",
    color: palette.muted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  categoryValue: {
    fontSize: "18px",
    fontWeight: 600,
    color: palette.text,
  },
  distribution: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  distributionRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  distributionLabel: {
    width: "40px",
    fontWeight: 600,
    color: palette.text,
  },
  progressTrack: {
    flex: 1,
    height: "6px",
    borderRadius: "999px",
    background: palette.surfaceAlt,
    border: `1px solid ${palette.border}`,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryDark})`,
  },
  distributionCount: {
    width: "32px",
    textAlign: "right",
    color: palette.muted,
  },
  starRow: {
    display: "flex",
    gap: "2px",
  },
  starIcon: {
    fontSize: "18px",
  },
  filterRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  filterBtn: {
    borderRadius: "999px",
    border: `1px solid ${palette.border}`,
    background: palette.surface,
    padding: "8px 14px",
    fontSize: "14px",
    color: palette.text,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
  },
  filterBtnActive: {
    background: palette.primary,
    color: "#fff",
    borderColor: palette.primary,
  },
  filterCount: {
    fontWeight: 600,
  },
  reviewList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingBottom: "32px",
  },
  reviewCard: {
    position: "relative",
    overflow: "hidden",
    background: palette.surface,
    borderRadius: "20px",
    border: `1px solid ${palette.border}`,
    boxShadow: "0 16px 44px rgba(15,23,42,0.08)",
    padding: "24px 26px 22px 32px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  reviewAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "6px",
    borderRadius: "20px 0 0 20px",
    opacity: 0.85,
    pointerEvents: "none",
  },
  reviewHeader: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  reviewAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: "18px",
    boxShadow: "0 8px 20px rgba(15,23,42,0.18)",
  },
  reviewInfo: {
    flex: 1,
    minWidth: "200px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  reviewTopRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "baseline",
    marginBottom: "4px",
  },
  reviewName: {
    fontWeight: 600,
    color: palette.text,
  },
  statusChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "2px 10px",
    borderRadius: "999px",
    background: palette.surfaceAlt,
    border: `1px solid ${palette.border}`,
    fontSize: "12px",
    color: palette.muted,
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
    display: "inline-flex",
  },
  reviewDate: {
    marginLeft: "auto",
    color: palette.muted,
    fontSize: "13px",
  },
  reviewTripRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },
  reviewTrip: {
    color: palette.text,
    fontWeight: 500,
    fontSize: "14px",
  },
  routeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "2px 10px",
    borderRadius: "999px",
    background: palette.surfaceAlt,
    border: `1px solid ${palette.border}`,
    fontSize: "12px",
    color: palette.muted,
    fontWeight: 500,
  },
  routeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: palette.primary,
  },
  reviewRating: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "6px",
  },
  ratingBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
    fontSize: "14px",
    padding: "4px 10px",
    borderRadius: "999px",
    border: "1px solid transparent",
  },
  ratingBadgeIcon: {
    fontSize: "16px",
  },
  reviewComment: {
    margin: 0,
    color: palette.text,
    lineHeight: 1.6,
  },
  attachmentsRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  reviewImage: {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "12px",
    border: `1px solid ${palette.border}`,
  },
  reviewMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  metaChip: {
    padding: "6px 12px",
    borderRadius: "12px",
    background: palette.surfaceAlt,
    border: `1px solid ${palette.border}`,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontSize: "13px",
  },
  metaChipLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: palette.muted,
  },
  threadSection: {
    borderRadius: "16px",
    border: `1px solid ${palette.border}`,
    background: palette.surfaceAlt,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  threadHeader: {
    fontWeight: 600,
    color: palette.text,
  },
  threadContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  threadCard: {
    background: "#fff",
    borderRadius: "12px",
    border: `1px solid ${palette.border}`,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  threadCardRecallable: {
    cursor: "pointer",
    borderColor: palette.primary,
    boxShadow: "0 8px 20px rgba(14,165,233,0.16)",
  },
  threadMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    fontSize: "13px",
    color: palette.muted,
  },
  threadMetaText: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  threadSender: {
    fontWeight: 600,
    color: palette.text,
  },
  threadDate: {
    marginLeft: "auto",
    color: palette.muted,
  },
  threadText: {
    margin: 0,
    color: palette.text,
  },
  threadRecallHint: {
    fontSize: "11px",
    color: palette.muted,
    fontStyle: "italic",
  },
  threadRecallBtn: {
    border: "none",
    borderRadius: "999px",
    padding: "4px 10px",
    background: palette.primary,
    color: "#fff",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(14,165,233,0.25)",
  },
  threadRecallBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  threadImage: {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "10px",
    border: `1px solid ${palette.border}`,
  },
  composerContainer: {
    borderTop: `1px solid ${palette.border}`,
    paddingTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  previewContainer: {
    position: "relative",
    width: "140px",
    borderRadius: "12px",
    overflow: "hidden",
    border: `1px solid ${palette.border}`,
  },
  previewImg: {
    width: "100%",
    height: "140px",
    objectFit: "cover",
    display: "block",
  },
  removePreviewBtn: {
    position: "absolute",
    top: "6px",
    right: "6px",
    border: "none",
    background: "rgba(15,23,42,0.8)",
    color: "#fff",
    borderRadius: "50%",
    width: "22px",
    height: "22px",
    cursor: "pointer",
  },
  inputGroup: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  attachBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: `1px solid ${palette.border}`,
    background: palette.surfaceAlt,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "18px",
  },
  attachBtnDisabled: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: `1px solid ${palette.border}`,
    background: palette.surfaceAlt,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
    cursor: "not-allowed",
  },
  inputField: {
    flex: 1,
    borderRadius: "14px",
    border: `1px solid ${palette.border}`,
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
  },
  sendBtn: {
    borderRadius: "14px",
    border: "none",
    background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryDark})`,
    color: "#fff",
    fontWeight: 600,
    padding: "10px 24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sendBtnDisabled: {
    borderRadius: "14px",
    border: "none",
    background: palette.border,
    color: palette.muted,
    fontWeight: 600,
    padding: "10px 24px",
    cursor: "not-allowed",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  miniSpinner: {
    width: "18px",
    height: "18px",
    border: `2px solid ${palette.surface}`,
    borderTop: `2px solid ${palette.primaryDark}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  deleteBtn: {
    position: "absolute",
    top: "18px",
    right: "22px",
    border: "none",
    borderRadius: "999px",
    padding: "6px 14px",
    background: palette.primaryDark,
    color: "#fff",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(37,99,235,0.25)",
  },
  deleteBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};
            