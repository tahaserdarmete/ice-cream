import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductCard from "../features/landing/components/product-card";
import { renderWithProviders, screen, userEvent } from "./test-utils";
import { mockProduct } from "../utils/constants";
import { toast } from "react-toastify";

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe("Product Card Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ürün prop'u gönderilmediğinde null döner", () => {
    renderWithProviders(<ProductCard product={null} />);

    const productCard = screen.queryByTestId("product-card");

    expect(productCard).toBeNull();
  });

  it("card üzerindeki ürün adı / fiyatı gibi bilgiler doğru listelenir", () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    // ürün resim arka planı doğru renkte mi?
    const productımage = screen.getByTestId("product-image");
    expect(productımage).toHaveClass(mockProduct.accent);

    // ürün resmi doğru görüntüleniyor mu?
    const productImage = screen.getByAltText(mockProduct.name);
    expect(productImage).toHaveAttribute("src", mockProduct.imageUrl);

    // ürünün adı doğru görüntüleniyor mu?
    screen.getByText(mockProduct.name);

    // ürünün fiyat ve birim bilgileri doğru görüntülüleniyor mu ?
    const price = screen.getByText(
      `₺${mockProduct.price} / ${mockProduct.unit}`
    );
  });

  it("servis seçeneklerinden birine tıklanınca seçenek güncellenir", async () => {
    //  userEvent kurulum
    const user = userEvent.setup();

    // component render
    renderWithProviders(<ProductCard product={mockProduct} />);

    // gerekli elementleri al
    const cornetBtn = screen.getByRole("button", { name: /külah/i });
    const cupBtn = screen.getByRole("button", { name: /bardakta/i });

    // külah butonu aktif mi
    expect(cornetBtn).toHaveClass("bg-rose-600");

    // bardak butonu pasif mi
    expect(cupBtn).toHaveClass("bg-white");

    // bardak butonuna tıkla
    await user.click(cupBtn);

    // külah butonu pasif mi
    expect(cornetBtn).toHaveClass("bg-white");

    // bardak butonu aktif mi
    expect(cupBtn).toHaveClass("bg-rose-600");

    // külah butonuna tıkla
    await user.click(cornetBtn);

    // külah butonu aktif mi
    expect(cornetBtn).toHaveClass("bg-rose-600");

    // bardak butonu pasif mi
    expect(cupBtn).toHaveClass("bg-white");
  });

  it("sepeke ekle butonuna tıklanınca reducer'a haber gönderilir", async () => {
    const user = userEvent.setup();

    const { store } = renderWithProviders(
      <ProductCard product={mockProduct} />
    );

    // gerekli emenetlerii al
    const addToCartBtn = screen.getByRole("button", { name: /sepete ekle/i });

    // store da sepet dizisi boştur
    expect(store.getState().basket.items).toHaveLength(0);
    expect(store.getState().basket.totalQuantity).toBe(0);

    // sepete ekle butonuna tıkla
    await user.click(addToCartBtn);

    // store da sepet dizisine 1 eleman eklenmiş mi
    const basket = store.getState().basket;
    expect(basket.items).toHaveLength(1);
    expect(basket.totalQuantity).toBe(1);
    expect(basket.totalAmount).toBe(mockProduct.price);
    expect(basket.items[0]).toMatchObject({
      productId: mockProduct.id,
      name: mockProduct.name,
      price: mockProduct.price,
      serving: "Külah",
      quantity: 1,
    });

    // toast.success fonksiyonu çağırılmış mı
    expect(toast.success).toHaveBeenCalledWith(
      `${mockProduct.name} sepete eklendi! (Külah)`
    );
  });

  it("aynı ürün farklı servis seçenekleri ile sepete eklenebilir", async () => {
    const user = userEvent.setup();

    const { store } = renderWithProviders(
      <ProductCard product={mockProduct} />
    );

    // gerekli elementleri al
    const cupBtn = screen.getByRole("button", { name: /bardakta/i });
    const addToCartBtn = screen.getByRole("button", { name: /sepete ekle/i });

    // külahta sepeete ekle
    await user.click(addToCartBtn);

    // bardakta butonu tıkla
    await user.click(cupBtn);

    // bardakta sepete ekle
    await user.click(addToCartBtn);

    // sepette iki farklı ürün var mı
    const basket = store.getState().basket;

    expect(basket.items).toHaveLength(2);
    expect(basket.totalQuantity).toBe(2);
    expect(basket.totalAmount).toBe(mockProduct.price * 2);
    expect(basket.items[0].serving).toBe("Külah");
    expect(basket.items[1].serving).toBe("Bardakta");
  });
});
