-- Thêm cột 'category' vào bảng 'expenses'
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category text;

-- Lệnh dưới đây để xóa trắng dữ liệu theo yêu cầu (Db tôi sẽ clear sau)
-- Bạn hãy bỏ comment (dấu --) ở 2 dòng dưới để chạy nếu thực sự muốn xóa:
-- TRUNCATE TABLE public.expenses;
-- TRUNCATE TABLE public.contributions;
