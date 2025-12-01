import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "./test-utils";
import BasketDrawer from "../features/landing/components/basket-drawer";
import { mockBasket } from "../utils/constants";
import { toast } from "react-toastify";

// react-toastify fonksiyonunu mock'la
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Basket Drawer Component", () => {
  const mockOnClose = vi.fn();

  // Her testten önce mockOnClose fonksiyonunu resetle (ortak mockOnClose fonksiyonunu kullandığımız için toHaveBeenCalledOnce fonksiyonunu birden fazla kullandığımızda hata veriyor.
  //  Bu sayede hata vermesini engelliyoruz.)
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Görünürlük, açma / kapama", () => {
    it("isOpen false ise drawer gizli olmalı", () => {
      renderWithProviders(<BasketDrawer isOpen={false} onClose={null} />);
      const drawer = screen.getByRole("dialog");

      expect(drawer).toHaveClass("translate-x-full");
    });

    it("isOpen true ise drawer görünür olmalı", () => {
      renderWithProviders(<BasketDrawer isOpen={true} onClose={null} />);

      const drawer = screen.getByRole("dialog");

      expect(drawer).toHaveClass("translate-x-0");
      expect(drawer).not.toHaveClass("translate-x-full");
    });

    it("X butonuna tıklanınca drawer alanı kapatılmalı", async () => {
      const user = userEvent.setup();
      renderWithProviders(<BasketDrawer isOpen={true} onClose={mockOnClose} />);

      // x butonunu al
      const closeBtn = screen.getByRole("button", { name: /sepeti kapat/i });

      // x butonuna tıkla
      await user.click(closeBtn);

      // mockOnClose fonksiyonu bir kere çağırıldı mı
      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it("Backdrop'a tıklanınca drawer kapatılmalı", async () => {
      const user = userEvent.setup();

      renderWithProviders(<BasketDrawer isOpen={true} onClose={mockOnClose} />);

      // drawer'ın arka planını al
      const backdrop = screen.getByTestId("backdrop");

      //   arka plana tıkla
      await user.click(backdrop);

      // mockOnClose fonksiyonu bir kere çağırıldı mı
      expect(mockOnClose).toHaveBeenCalledOnce();
    });
  });

  describe("Sepet İçeriği", () => {
    it("sepet boşsa boş mesajı görünür mü", () => {
      renderWithProviders(<BasketDrawer isOpen={true} onClose={mockOnClose} />);

      screen.getByText("Sepetiniz boş");
    });

    it("sepet dolu ise ürünlerin bilgileri listelenmelidir", () => {
      renderWithProviders(<BasketDrawer isOpen={true} onClose={null} />, {
        preloadedState: mockBasket,
      });

      //   sepetteki her ürünün isim foto vb bilgileri ekrana basılır
      mockBasket.basket.items.forEach((item) => {
        screen.getByText(item.name);
        screen.getByText(item.quantity);
        screen.getByText(item.serving);
        screen.getByText(`₺${item.totalPrice.toFixed(2)}`);
        const image = screen.getByAltText(item.name);
        expect(image).toHaveAttribute("src", item.imageUrl);
      });
    });

    it("toplam ürün sayısı ve toplam fiyat doğru görüntülenir", () => {
      renderWithProviders(<BasketDrawer isOpen={true} onClose={null} />, {
        preloadedState: mockBasket,
      });
      // toplam ürün sayısı elementi doğru mu
      screen.getByText(`(${mockBasket.basket.totalQuantity} ürün)`);

      // toplam fiyat elementi doğru mu
      screen.getByText(`₺${mockBasket.basket.totalAmount.toFixed(2)}`);
    });
  });

  describe("Miktar artırma / azaltma / silme / onaylama", () => {
    it("+ butonuna tıklanınca miktar artırılır", async () => {
      const user = userEvent.setup();

      const { store } = renderWithProviders(
        <BasketDrawer isOpen={true} onClose={null} />,
        {
          preloadedState: mockBasket,
        }
      );

      // + butonunu al
      const increaseBtn = screen.getByRole("button", {
        name: /1-külah miktarını artır/i,
      });

      // ürünün sepetteki mikatarı 2 dir
      expect(store.getState().basket.items[0].quantity).toBe(2);

      //  + butonuna tıkla
      await user.dblClick(increaseBtn);

      //  ürünün sepetteki miktarı 4 tür
      expect(store.getState().basket.items[0].quantity).toBe(4);
    });

    it("- butonuna tıklanınca miktarı azaltılır / kaldırılır", async () => {
      const user = userEvent.setup();

      const { store } = renderWithProviders(
        <BasketDrawer isOpen={true} onClose={null} />,
        {
          preloadedState: mockBasket,
        }
      );

      // gerekli elementleri al
      const decreaseBtn = screen.getByRole("button", {
        name: /1-külah miktarını azalt/i,
      });

      //  ilk ürünün sepetteki miktarı 2 dir ve sepette 2 ürün var
      expect(store.getState().basket.items[0].quantity).toBe(2);
      expect(store.getState().basket.items).toHaveLength(2);

      //  - butonuna tıkla
      await user.click(decreaseBtn);

      // üründeki sepetteki miktarı 1 dir
      expect(store.getState().basket.items[0].quantity).toBe(1);

      // - butonuna tıkla
      await user.click(decreaseBtn);

      // ürün sepetten kaldırımıştır
      expect(store.getState().basket.items).toHaveLength(1);
    });

    it("sil butonuna tıklanınca ürün sepetten kaldırılır", async () => {
      const user = userEvent.setup();

      const { store } = renderWithProviders(
        <BasketDrawer isOpen={true} onClose={null} />,
        { preloadedState: mockBasket }
      );

      // gerekli elementleri al
      const removeBtn1 = screen.getByRole("button", {
        name: /1-külah ürününü sepetten çıkar/i,
      });
      const removeBtn2 = screen.getByRole("button", {
        name: /2-bardakta ürününü sepetten çıkar/i,
      });

      // sepette 2 ürün vardır
      expect(store.getState().basket.items).toHaveLength(2);

      // ilk ürünün sil butonuna tıkla
      await user.click(removeBtn1);

      // sepetten 1 ürün kalmıştır
      expect(store.getState().basket.items).toHaveLength(1);

      // ikinci ürünün sil butonuna tıkla
      await user.click(removeBtn2);

      // sepette 0 ürün kalmıştır
      expect(store.getState().basket.items).toHaveLength(0);

      // toast.info fonksiyonu çağırılmış mı
      expect(toast.info).toHaveBeenCalledWith("Ürün sepetten çıkarıldı");
    });

    it("siparişi onaylama butonuna tıklanınca sepet temizlenir", async () => {
      const user = userEvent.setup();

      const { store } = renderWithProviders(
        <BasketDrawer isOpen={true} onClose={mockOnClose} />,
        { preloadedState: mockBasket }
      );

      // spiarişi onaylama butonunu al
      const confirmBtn = screen.getByRole("button", {
        name: "Siparişi onayla",
      });

      // butona tıkla
      await user.click(confirmBtn);

      // store'un güncel değerini kontrol et
      const state = store.getState();
      expect(state.basket.items).toHaveLength(0);
      expect(state.basket.totalQuantity).toBe(0);
      expect(state.basket.totalAmount).toBe(0);

      //  drawerı kapatacak onClose fonksiyonu çağırılmış mı
      expect(mockOnClose).toHaveBeenCalledOnce();

      // toast.success çağırılmış mı
      expect(toast.success).toHaveBeenCalledWith(
        "Siparişiniz alındı! Teşekkür ederiz 🎉"
      );
    });
  });
});
