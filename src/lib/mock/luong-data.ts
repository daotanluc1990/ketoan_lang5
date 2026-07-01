/**
 * Mock data cho module Lương & Nhân sự (V1).
 * V2: thay bằng import Excel thật vào DATA_NHAN_SU_LUONG sheet.
 */

export const chamCongMock = [
  ['NV001', 'Nguyễn Văn An', 'Bếp', 'Làng NVT', '26', '208', '2', '0', '0'],
  ['NV002', 'Trần Thị Bình', 'Pha chế', 'Làng NVT', '25', '200', '1', '1', '0'],
  ['NV003', 'Lê Minh Cường', 'Thu ngân', 'Làng NVT', '26', '208', '0', '0', '0'],
  ['NV004', 'Phạm Thu Dung', 'Phục vụ', 'Làng NVT', '24', '192', '3', '0', '1'],
  ['NV005', 'Hoàng Văn Em', 'Bếp', 'Làng NVT', '26', '208', '0', '0', '0'],
  ['NV006', 'Đỗ Thị Phương', 'Thu ngân', 'Làng NVT', '25', '200', '1', '0', '0'],
  ['NV007', 'Vũ Minh Giang', 'Pha chế', 'Làng NVT', '26', '208', '0', '0', '0'],
  ['NV008', 'Bùi Thị Hoa', 'Phục vụ', 'Làng NVT', '22', '176', '4', '2', '0'],
];

export const tamUngMock = [
  ['NV001', 'Nguyễn Văn An', '1.500.000', 'Trừ lương T06', 'Đã duyệt'],
  ['NV004', 'Phạm Thu Dung', '800.000', 'Trừ lương T06', 'Đã duyệt'],
  ['NV008', 'Bùi Thị Hoa', '500.000', 'Chưa trừ', 'Chờ duyệt'],
  ['NV002', 'Trần Thị Bình', '1.000.000', 'Đã trừ T05', 'Đã trừ'],
  ['NV006', 'Đỗ Thị Phương', '1.200.000', 'Trừ lương T06', 'Đã duyệt'],
];

export const bangLuongMock = [
  ['NV001', 'Nguyễn Văn An', 'Bếp', '9.000.000', '1.000.000', '500.000', '1.500.000', '8.000.000'],
  ['NV002', 'Trần Thị Bình', 'Pha chế', '8.000.000', '800.000', '300.000', '0', '8.500.000'],
  ['NV003', 'Lê Minh Cường', 'Thu ngân', '8.500.000', '900.000', '200.000', '0', '9.200.000'],
  ['NV004', 'Phạm Thu Dung', 'Phục vụ', '7.000.000', '500.000', '0', '800.000', '6.700.000'],
  ['NV005', 'Hoàng Văn Em', 'Bếp', '9.000.000', '1.000.000', '500.000', '0', '9.500.000'],
  ['NV006', 'Đỗ Thị Phương', 'Thu ngân', '8.500.000', '900.000', '200.000', '1.200.000', '8.400.000'],
  ['NV007', 'Vũ Minh Giang', 'Pha chế', '8.000.000', '800.000', '300.000', '0', '8.500.000'],
  ['NV008', 'Bùi Thị Hoa', 'Phục vụ', '6.500.000', '300.000', '0', '500.000', '6.300.000'],
];
