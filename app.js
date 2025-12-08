/* ============================
   CRIAR ESTRUTURAS DINÂMICAS
   (overlay, painel e modal PIX)
   ============================ */
function criarEstruturasDinamicas() {
    if (document.getElementById("cart-panel")) return; // evita duplicar

    const overlay = document.createElement("div");
    overlay.id = "cart-overlay";
    overlay.className = "cart-overlay";
    document.body.appendChild(overlay);

    const panel = document.createElement("div");
    panel.id = "cart-panel";
    panel.className = "cart-panel";

    panel.innerHTML = `
        <div class="cart-header">
            <h2>Seu Carrinho</h2>
            <button class="close-cart">✖</button>
        </div>
        <ul class="cart-items"></ul>
        <div class="cart-footer">
            <p class="cart-total">Total: R$ 0,00</p>
            <button class="checkout-btn" id="checkout-btn">Finalizar Compra</button>
        </div>
    `;
    document.body.appendChild(panel);

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

/* ============================
   LÓGICA PRINCIPAL DO SITE
   ============================ */
document.addEventListener("DOMContentLoaded", () => {

    // carrega carrinho do localStorage (array de {name, price, quantity})
    let cart = JSON.parse(localStorage.getItem("cartItems")) || [];

    // seletores (após criar estruturas)
    const cartPanel     = document.getElementById("cart-panel");
    const cartOverlay   = document.getElementById("cart-overlay");
    const cartListEl    = document.querySelector('.cart-items');
    const cartTotalEl   = document.querySelector('.cart-total');
    const cartCountSpan = document.querySelector('.cart-count');
    const cartIcon      = document.querySelector('.cart-icon');

    const closeCartBtn  = document.querySelector('.close-cart');
    const pixModal      = document.getElementById("pix-modal");
    const closePixBtn   = document.getElementById("close-pix");

    // Toast simples
    function showToast(msg) {
        const t = document.createElement("div");
        t.className = "toast";
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(()=> t.classList.add("show"));
        setTimeout(()=> { t.classList.remove("show"); setTimeout(()=> t.remove(), 300); }, 1800);
    }

    // abre/fecha painel
    cartIcon.addEventListener("click", (e) => {
        e.preventDefault();
        cartPanel.classList.add("active");
        cartOverlay.classList.add("active");
        renderCart(); // atualiza quando abrir
    });
    closeCartBtn.addEventListener("click", () => { cartPanel.classList.remove("active"); cartOverlay.classList.remove("active"); });
    cartOverlay.addEventListener("click", () => { cartPanel.classList.remove("active"); cartOverlay.classList.remove("active"); });

    // atualizar contador (quantidade total)
    function updateCartCount() {
        const totalQty = cart.reduce((s, it) => s + (it.quantity||0), 0);
        cartCountSpan.textContent = totalQty;
    }

    function saveCart() {
        localStorage.setItem("cartItems", JSON.stringify(cart));
    }

    // render do painel do carrinho
    function renderCart() {
        cartListEl.innerHTML = "";
        let total = 0;

        if (!cart.length) {
            const li = document.createElement("li");
            li.className = "cart-empty";
            li.textContent = "Seu carrinho está vazio.";
            cartListEl.appendChild(li);
        }

        cart.forEach((item, idx) => {
            total += item.price * item.quantity;
            const li = document.createElement("li");
            li.className = "cart-item";
            li.innerHTML = `
                <div class="cart-info">
                    <strong>${item.name}</strong>
                    <span>R$ ${item.price.toFixed(2).replace(".", ",")}</span>
                    <span>Qtd: ${item.quantity}</span>
                </div>
                <button class="delete-item" data-index="${idx}" aria-label="Remover item">🗑</button>
            `;
            cartListEl.appendChild(li);
        });

        cartTotalEl.textContent = `Total: R$ ${total.toFixed(2).replace(".", ",")}`;
        updateCartCount();
        saveCart();
    }

    // adicionar item ao carrinho (nome e price numérico)
    function addToCart(name, price) {
        const found = cart.find(i => i.name === name);
        if (found) found.quantity++;
        else cart.push({ name, price, quantity: 1 });

        renderCart();
        showToast(`✔ ${name} adicionado`);
    }

    // remover item (pelo index)
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-item")) {
            const index = parseInt(e.target.dataset.index, 10);
            if (!isNaN(index)) {
                cart.splice(index, 1);
                renderCart();
                showToast("Item removido");
            }
        }
    });

    // ligando botões "Adicionar ao Carrinho" (usa classe add-to-cart-btn no HTML)
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("add-to-cart-btn")) {
            const card = e.target.closest(".product-card, .carousel-item");
            if (!card) return;
            const nameEl = card.querySelector(".product-name, h3");
            const priceEl = card.querySelector(".product-price, .price, span.product-price");

            const name = nameEl ? nameEl.textContent.trim() : "Produto";
            // tenta pegar data-price, se não houver faz parse do texto
            let price = 0;
            if (priceEl) {
                const dp = priceEl.dataset && priceEl.dataset.value;
                if (dp) price = parseFloat(dp);
                else {
                    const text = priceEl.textContent.replace(/\s/g,"").replace("R$","").replace(",",".");
                    price = parseFloat(text) || 0;
                }
            }
            addToCart(name, price);
        }
    });

    // FINALIZAR COMPRA -> PIX (usa funções CRC/EMV similares às suas)
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
    function emv(id, value) { return id + String(value.length).padStart(2,"0") + value; }
    function gerarPayloadPIX({ chave, merchant, city, amount }) {
        const gui = emv("00", "BR.GOV.BCB.PIX") + emv("01", chave);
        const merchantAccount = emv("26", gui);
        const merchantInfo = emv("52", "0000") + emv("53", "986") + emv("54", amount) + emv("58", "BR") + emv("59", merchant) + emv("60", city);
        const additional = emv("62", emv("05", "***"));
        const payloadSemCRC = "000201010212" + merchantAccount + merchantInfo + additional + "6304";
        return payloadSemCRC + gerarCRC16(payloadSemCRC);
    }
    function gerarCodigoPIX(valor) {
        const chave = "+5547984728108";
        const nome = "Vaporize Store";
        const cidade = "MACEIO";
        return gerarPayloadPIX({ chave, merchant: nome, city: cidade, amount: valor.toFixed(2) });
    }

    document.addEventListener("click", (e) => {
        if (e.target.id === "checkout-btn") {
            const total = cart.reduce((s,i) => s + i.price * i.quantity, 0);
            if (!total) { showToast("Carrinho vazio!"); return; }
            const codigo = gerarCodigoPIX(total);
            pixModal.classList.add("active");
            document.querySelector(".pix-value").textContent = `Valor: R$ ${total.toFixed(2).replace(".", ",")}`;
            document.getElementById("pix-code").value = codigo;
            const canvas = document.getElementById("pix-qrcode-canvas");
            if (window.QRCode && canvas) QRCode.toCanvas(canvas, codigo).catch(()=>{});
        }
    });
    if (closePixBtn) closePixBtn.addEventListener("click", ()=> pixModal.classList.remove("active"));
    document.getElementById("copy-pix")?.addEventListener("click", () => {
        const txt = document.getElementById("pix-code");
        if (!txt) return;
        txt.select();
        navigator.clipboard.writeText(txt.value).then(()=> showToast("Código PIX copiado!"));
    });

    // carregamento inicial
    renderCart();
});

/* =======================================================
   PESQUISA AO VIVO + PAUSAR CARROSSEL (mantém estático enquanto busca)
   ======================================================= */
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("live-search");
    const carouselTrack = document.querySelector(".carousel-track");
    if (!searchInput || !carouselTrack) return;

    searchInput.addEventListener("input", () => {
        const termo = searchInput.value.trim().toLowerCase();
        const cards = document.querySelectorAll(".carousel-item, .product-card");

        // pausa/retoma animação
        if (termo.length > 0) {
            carouselTrack.style.animation = "none";
            carouselTrack.style.transform = "translateX(0)"; // mostra primeiro bloco
        } else {
            carouselTrack.style.animation = ""; // volta ao CSS
        }

        // Filtra e "estabiliza" (display flex para manter layout)
        cards.forEach(card => {
            const nome = (card.querySelector(".product-name")?.textContent || card.querySelector("h3")?.textContent || "").toLowerCase();
            if (!termo || nome.includes(termo)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    });

    // Se quiser, ao tirar foco limpa (volta ao normal)
    searchInput.addEventListener("blur", () => {
        if (searchInput.value.trim() === "") {
            const cards = document.querySelectorAll(".carousel-item, .product-card");
            cards.forEach(c => c.style.display = "");
        }
    });
});
