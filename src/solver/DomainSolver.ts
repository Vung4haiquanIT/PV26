import { SimulationObject, SolverResult } from '../types';

export const runDomainSolvers = (objects: SimulationObject[]): SolverResult[] => {
  const uav = objects.find(o => o.type === 'UAV');
  const usv = objects.find(o => o.type === 'USV');

  const results: SolverResult[] = [];

  if (usv) {
    results.push({
      solverId: 'sol-usv-cpa',
      problemName: 'Tính toán điểm hội tụ (CPA) & Thời gian tiếp cận USV',
      inputSummary: `${usv.name} v=${usv.speed}kts, H=${usv.heading}°, Cự ly: ${usv.range || 6.8}km`,
      cpa: 0.85,
      timeToCPA: Math.max(15, Math.round(140 - (usv.speed * 2))),
      recommendedAction: 'Cơ động bẻ lái trái 25 độ, tăng tốc tàu lên 22kts để phá góc tiếp cận.',
      validationStatus: usv.range && usv.range < 5 ? 'NGUY HIỂM' : 'CẢNH BÁO',
      confidence: 95.0
    });
  }

  if (uav) {
    results.push({
      solverId: 'sol-uav-intercept',
      problemName: 'Đánh giá quỹ đạo bay & Thời điểm phóng mồi bẫy / Gây nhiễu UAV',
      inputSummary: `${uav.name} v=${uav.speed}m/s, Alt=${uav.altitude}m, Cự ly: ${uav.range || 12.5}km`,
      cpa: 0.15,
      timeToCPA: Math.max(10, Math.round(90 - uav.speed)),
      recommendedAction: 'Kích hoạt tổ hợp gây nhiễu định hướng băng thông rộng ở cự ly < 10km.',
      validationStatus: 'NGUY HIỂM',
      confidence: 98.4
    });
  }

  results.push({
    solverId: 'sol-ew-defense',
    problemName: 'Phân tích vùng hiệu lực Tác chiến điện tử (EW)',
    inputSummary: 'Hệ thống trinh sát vô tuyến điện: Hoạt động bình thường (SNR: 18dB)',
    cpa: 0,
    timeToCPA: 0,
    recommendedAction: 'Sẵn sàng phóng đạn rocket gây nhiễu chaff/flare khẩn cấp nếu UAV xuyên thủng cự ly 4km.',
    validationStatus: 'ĐẠT',
    confidence: 99.1
  });

  return results;
};
