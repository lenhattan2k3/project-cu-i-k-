import mongoose from "mongoose";

const nhaXeSchema = new mongoose.Schema(
	{
		partnerId: { type: String, required: true, unique: true, index: true },
		name: { type: String, required: true, trim: true },
		slug: { type: String, trim: true },
	},
	{ timestamps: true }
);

export default mongoose.model("NhaXe", nhaXeSchema);
