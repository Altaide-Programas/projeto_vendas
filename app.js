/* ============================================================
   CRIAR CARRINHO E PIX DINAMICAMENTE
============================================================ */
function criarEstruturasDinamicas() {

    /* ---------- Criar overlay ---------- */
    const overlay = document.createElement("div");
    overlay.id = "cart-overlay";
    overlay.className = "cart-overlay";
    document.body.appendChild(overlay);

    /* ---------- Criar painel lateral ---------- */
    const panel = document.createElement("div");
    panel.id = "cart-panel";
    panel.className = "cart-panel";

    panel.innerHTML = `
        <div class="cart-header">
            <h2>Seu Carrinho</h2>
            <button class="close-cart">✖</button>
        </div>
        <div class="cart-items"></div>
        <div class="cart-footer">
            <p class="cart-total">Total: R$ 0,00</p>
            <button class="checkout-btn" id="checkout-btn">Finalizar Compra</button>
        </div>
    `;

    document.body.appendChild(panel);

    /* ---------- Criar modal PIX ---------- */
    const pixModal = document.createElement("div");
    pixModal.id = "pix-modal";
    pixModal.className = "pix-modal";

    pixModal.innerHTML = `
        <div class="pix-content">
            <h2>Pagamento via PIX</h2>
            <p class="pix-value">Valor: R$ 0,00</p>

            <div class="pix-qrcode">
                <canvas id="pix-qrcode-canvas"></canvas>
            </div>

            <div class="pix-copy-area">
                <textarea id="pix-code" readonly></textarea>
                <button id="copy-pix">Copiar Código PIX</button>
            </div>

            <button class="close-pix" id="close-pix">Fechar</button>
        </div>
    `;

    document.body.appendChild(pixModal);
}

document.addEventListener("DOMContentLoaded", criarEstruturasDinamicas);

/* ============================================================
   CÓDIGO PRINCIPAL
============================================================ */
document.addEventListener("DOMContentLoaded", () => {

    let cart = [];

    /* ============== SELETORES DINÂMICOS (criadas após DOM) ============= */
    const cartPanel        = document.getElementById("cart-panel");
    const cartOverlay      = document.getElementById("cart-overlay");
    const cartItems        = document.querySelector('.cart-items');
    const cartTotal        = document.querySelector('.cart-total');
    const cartCountSpan    = document.querySelector('.cart-count');

    const closeCartBtn     = document.querySelector('.close-cart');
    const cartIcon         = document.querySelector('.cart-icon');

    const pixModal         = document.getElementById("pix-modal");
    const closePix         = document.getElementById("close-pix");

    /* ============================================================
       TOAST
    ============================================================ */
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    /* ============================================================
       ABRIR/FECHAR CARRINHO
    ============================================================ */
    cartIcon.addEventListener('click', e => {
        e.preventDefault();
        cartPanel.classList.add('active');
        cartOverlay.classList.add('active');
    });

    closeCartBtn.addEventListener('click', () => {
        cartPanel.classList.remove('active');
        cartOverlay.classList.remove('active');
    });

    cartOverlay.addEventListener('click', () => {
        cartPanel.classList.remove('active');
        cartOverlay.classList.remove('active');
    });

    /* ============================================================
       ADICIONAR AO CARRINHO
    ============================================================ */
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {

            const card = btn.closest('.product-card');
            const name = card.querySelector('.product-name').textContent;
            const price = card.querySelector('.product-price').textContent;

            cart.push({ name, price });

            renderCart();
            cartCountSpan.textContent = cart.length;

            showToast(`✔ ${name} adicionado`);
        });
    });

    /* ============================================================
       RENDERIZAR CARRINHO
    ============================================================ */
    function renderCart() {
        cartItems.innerHTML = "";
        let total = 0;

        cart.forEach(item => {
            const div = document.createElement("div");
            div.className = "cart-item";

            div.innerHTML = `
                <span>${item.name}</span>
                <span>${item.price}</span>
            `;

            cartItems.appendChild(div);

            total += parseFloat(item.price.replace("R$", "").replace(",", "."));
        });

        window.totalCarrinho = total;
        cartTotal.textContent = `Total: R$ ${total.toFixed(2).replace(".", ",")}`;
    }


    /* ============================================================
       CRC16 — OBRIGATÓRIO
    ============================================================ */
    function gerarCRC16(str) {
        let crc = 0xFFFF;

        for (let i = 0; i < str.length; i++) {
            crc ^= str.charCodeAt(i) << 8;

            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
                else crc <<= 1;

                crc &= 0xFFFF;
            }
        }
        return crc.toString(16).toUpperCase().padStart(4, "0");
    }

    function emv(id, value) {
        return id + String(value.length).padStart(2, "0") + value;
    }


    /* ============================================================
       GERAR PAYLOAD PIX
    ============================================================ */
    function gerarPayloadPIX({ chave, merchant, city, amount }) {

        const gui = emv("00", "BR.GOV.BCB.PIX") +
                    emv("01", chave);

        const merchantAccount = emv("26", gui);

        const merchantInfo =
            emv("52", "0000") +
            emv("53", "986") +
            emv("54", amount) +
            emv("58", "BR") +
            emv("59", merchant) +
            emv("60", city);

        const additional = emv("62", emv("05", "***"));

        const payloadSemCRC =
            "000201010212" +
            merchantAccount +
            merchantInfo +
            additional +
            "6304";

        return payloadSemCRC + gerarCRC16(payloadSemCRC);
    }

    function gerarCodigoPIX(valor) {
        const chave   = "+5547984728108";
        const nome    = "Vaporize Store";
        const cidade  = "MACEIO";

        return gerarPayloadPIX({
            chave,
            merchant: nome,
            city: cidade,
            amount: valor.toFixed(2)
        });
    }


    /* ============================================================
       FINALIZAR COMPRA → MOSTRAR PIX
    ============================================================ */
    document.addEventListener("click", e => {

        if (e.target.id === "checkout-btn") {

            if (!window.totalCarrinho || window.totalCarrinho <= 0) {
                showToast("Carrinho vazio!");
                return;
            }

            const valor = window.totalCarrinho;
            const codigoPIX = gerarCodigoPIX(valor);

            pixModal.classList.add("active");

            document.querySelector(".pix-value").textContent =
                `Valor: R$ ${valor.toFixed(2).replace(".", ",")}`;

            document.getElementById("pix-code").value = codigoPIX;

            const canvas = document.getElementById("pix-qrcode-canvas");
            QRCode.toCanvas(canvas, codigoPIX);
        }
    });

    closePix.addEventListener("click", () => {
        pixModal.classList.remove("active");
    });


    /* COPIAR CÓDIGO PIX */
    document.getElementById("copy-pix").addEventListener("click", () => {
        const txt = document.getElementById("pix-code");
        txt.select();
        navigator.clipboard.writeText(txt.value);
        showToast("Código PIX copiado!");
    });

});
