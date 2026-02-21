// Cấu hình giá bàn bi-a theo giờ
export const billiardPricing = {
  standard: {
    name: "Bàn Thường",
    pricePerHour: 50000, // 50k/giờ
    description: "Bàn bi-a tiêu chuẩn",
  },
  vip: {
    name: "Bàn VIP",
    pricePerHour: 80000, // 80k/giờ
    description: "Bàn bi-a cao cấp, phòng riêng",
  },
};

// Thời gian tối thiểu tính phí (phút)
export const minimumPlayTime = 30;

// Function tính tiền theo thời gian
export const calculateBilliardCost = (
  startTime,
  endTime,
  tableType = "standard",
) => {
  if (!startTime) return 0;

  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();

  // Tính số giờ (làm tròn lên 0.5 giờ)
  const hours = (end - start) / (1000 * 60 * 60);
  const roundedHours = Math.ceil(hours * 2) / 2; // Round to nearest 0.5

  const pricePerHour = billiardPricing[tableType].pricePerHour;
  return Math.round(roundedHours * pricePerHour);
};

// Format thời gian chơi
export const formatPlayTime = (startTime, endTime = null) => {
  if (!startTime) return "00:00:00";

  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diff = end - start;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
