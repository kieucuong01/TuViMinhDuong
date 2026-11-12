ALTER TABLE "QuanOrder"
  DROP CONSTRAINT "QuanOrder_table_check",
  ADD CONSTRAINT "QuanOrder_table_check" CHECK ("tableNumber" BETWEEN 1 AND 6);
