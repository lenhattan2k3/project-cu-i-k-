import { useState } from 'react';
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaEnvelopeOpen } from 'react-icons/fa';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  date: string;
  isRead: boolean;
}

export default function Notification() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Khuyến mãi mới',
      message: 'Giảm 20% cho tất cả các chuyến xe trong tháng này! Đừng bỏ lỡ cơ hội đặt vé giá tốt.',
      type: 'success',
      date: '2025-10-22',
      isRead: false
    },
    {
      id: '2',
      title: 'Cập nhật lịch trình',
      message: 'Chuyến xe Hà Nội - Sapa có thay đổi giờ khởi hành từ 6:30 thành 7:00. Vui lòng kiểm tra lại chi tiết vé.',
      type: 'warning',
      date: '2025-10-21',
      isRead: true
    },
    {
      id: '3',
      title: 'Thông báo bảo trì',
      message: 'Hệ thống sẽ bảo trì nâng cấp vào ngày 25/10/2025 từ 23:00 - 24:00 để cải thiện hiệu suất.',
      type: 'info',
      date: '2025-10-20',
      isRead: true
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, isRead: true } : notif
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <FaCheckCircle className="text-green-500 text-xl" />;
      case 'warning': return <FaExclamationTriangle className="text-yellow-500 text-xl" />;
      default: return <FaInfoCircle className="text-blue-500 text-xl" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-300';
      case 'warning': return 'border-yellow-300';
      default: return 'border-blue-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-extrabold text-blue-600 mb-8 flex items-center gap-3">
        <FaBell className="text-blue-500" /> Trung tâm Thông báo
      </h2>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            // Thêm shadow và nền trắng cho thông báo chưa đọc để nổi bật
            className={`flex items-start p-5 rounded-xl border-l-4 transition duration-300 
                        ${getTypeStyles(notif.type)} 
                        ${!notif.isRead 
                            ? 'bg-white shadow-lg border-opacity-100 hover:shadow-xl' 
                            : 'bg-gray-50 border-opacity-50 text-gray-500'
                        }`}
          >
            {/* Icon phân loại */}
            <div className={`flex-shrink-0 mr-4 ${!notif.isRead ? 'opacity-100' : 'opacity-70'}`}>
              {getTypeIcon(notif.type)}
            </div>

            {/* Nội dung thông báo */}
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                {/* Tiêu đề */}
                <h3 
                  className={`font-semibold text-lg ${!notif.isRead ? 'text-gray-800' : 'text-gray-600'}`}
                >
                  {notif.title}
                  {!notif.isRead && (
                    <span className="ml-3 inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse" title="Chưa đọc"></span>
                  )}
                </h3>
                
                {/* Ngày và trạng thái */}
                <span className={`text-sm ${!notif.isRead ? 'text-gray-500' : 'text-gray-400'} flex items-center`}>
                    {new Date(notif.date).toLocaleDateString()}
                </span>
              </div>

              {/* Chi tiết thông báo */}
              <p className={`mt-1 ${!notif.isRead ? 'text-gray-700' : 'text-gray-500'}`}>{notif.message}</p>

              {/* Nút Đánh dấu đã đọc */}
              {!notif.isRead && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
                >
                  <FaEnvelopeOpen />
                  <span>Đánh dấu đã đọc</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12 border border-dashed border-blue-300 rounded-lg bg-white mt-6">
          <FaBell className="text-4xl text-blue-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 font-medium">Tuyệt vời! Bạn không có thông báo mới nào.</p>
          <p className="text-sm text-gray-400 mt-2">Mọi thứ đều được cập nhật.</p>
        </div>
      )}
    </div>
  );
}