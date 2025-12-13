// =========================
// ELEMENTOS DO MODAL
// =========================
const modal = document.getElementById("modal-produto");
const closeModal = document.querySelector(".close-modal");

const inputNome = document.getElementById("nome");
const inputTelefone = document.getElementById("telefone");
const inputEndereco = document.getElementById("endereco");
const blocoSabor = document.getElementById("bloco-sabor");
const flavorsContainer = document.getElementById("flavors-container");

let isCombo = false; // flag para tratamento de combo (3 por 250)

let produtoSelecionado = "";
let categoriaSelecionada = "";
let precoSelecionado = "";

// =========================
// BUSCA AO DIGITAR (live search)
// =========================
const liveSearchInput = document.getElementById('live-search');
if (liveSearchInput) {
    const carouselTrack = document.querySelector('.carousel-tracS');
    const carouselContainer = document.querySelector('.carousel-container');

    function updateNoResults(show) {
        let nr = document.querySelector('.no-results');
        if (show) {
            if (!nr) {
                nr = document.createElement('div');
                nr.className = 'no-results';
                nr.textContent = 'Nenhum produto encontrado.';
                if (carouselContainer) carouselContainer.appendChild(nr);
            }
        } else {
            nr?.remove();
        }
    }

    liveSearchInput.addEventListener('input', (e) => {
        const q = String(e.target.value || '').trim().toLowerCase();
        let visibleCount = 0;
        document.querySelectorAll('.product-card').forEach(card => {
            const name = (card.querySelector('.product-name')?.textContent || '').toLowerCase();
            const category = (card.querySelector('.product-category')?.textContent || '').toLowerCase();
            const price = (card.querySelector('.product-price')?.textContent || '').toLowerCase();
            const match = !q || name.includes(q) || category.includes(q) || price.includes(q);
            card.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        });

        // Se há um termo de busca, pause a animação e centralize os resultados
        if (carouselTrack) {
            if (q) {
                carouselTrack.classList.add('search-active');
            } else {
                carouselTrack.classList.remove('search-active');
            }
        }

        updateNoResults(visibleCount === 0);
    });

    // permitir tecla Enter para focar no primeiro resultado (acessibilidade)
    liveSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const first = document.querySelector('.product-card:not([style*="display: none"]) .card-link');
            if (first) first.focus();
        }
    });
}

// =========================
// ABRIR MODAL AO CLICAR EM "ADICIONAR AO CARRINHO"
// =========================
document.querySelectorAll(".add-to-cart-btn").forEach((btn, index) => {
    btn.addEventListener("click", () => {
        const card = btn.closest(".product-card") || btn.closest(".promo-card");

        if (!card) return; // safety check

        // Handle different card structures
        let nameEl, categoryEl, priceEl;
        if (card.classList.contains("product-card")) {
            nameEl = card.querySelector(".product-name");
            categoryEl = card.querySelector(".product-category");
            priceEl = card.querySelector(".product-price");
        } else if (card.classList.contains("promo-card")) {
            nameEl = card.querySelector("h3");
            categoryEl = null; // essences don't have category, but we'll set it to "essência"
            priceEl = card.querySelector(".price-promo");
        }

        produtoSelecionado = nameEl ? nameEl.textContent : "";
        categoriaSelecionada = categoryEl ? categoryEl.textContent.toLowerCase() : "essência";
        precoSelecionado = priceEl ? priceEl.textContent : "";

        // Mostrar campo(s) de sabor SOMENTE se for pod/vape
        if (
            categoriaSelecionada.includes("pod") ||
            categoriaSelecionada.includes("vape") ||
            categoriaSelecionada.includes("descartável") ||
            categoriaSelecionada.includes("juice") ||
            categoriaSelecionada.includes("sabores")
        ) {
            createFlavorInputs(1);
            isCombo = false;
        } else if (categoriaSelecionada.includes("essência")) {
            createFlavorInputs(2);
            isCombo = false;
        } else {
            hideFlavorInputs();
            isCombo = false;
        }

        modal.style.display = "flex";
    });
});

// Helpers para inputs de sabor dinâmicos
function createFlavorInputs(count) {
    if (!flavorsContainer) return;
    flavorsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'sabor-input';
        input.placeholder = count === 1 ? 'Ex: Uva, Morango...' : `Sabor ${i+1} (Ex: Uva)`;
        input.id = count === 1 ? 'sabor' : `sabor${i+1}`;
        flavorsContainer.appendChild(input);
    }
    blocoSabor.style.display = 'block';
}

function hideFlavorInputs() {
    if (!flavorsContainer) return;
    flavorsContainer.innerHTML = '';
    blocoSabor.style.display = 'none';
}

// =========================
// FECHAR MODAL
// =========================
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
});

// =========================
// ENVIAR PEDIDO PARA WHATSAPP
// =========================
document.getElementById("btn-enviar").addEventListener("click", () => {
    console.log('btn-enviar clicked');
    try {
        const nome = inputNome.value.trim();
        const telefone = inputTelefone.value.trim();
        const endereco = inputEndereco.value.trim();
        // coletar sabores (suporta 1 ou vários inputs dinamicamente)
        let sabor = "";
        const flavorInputs = flavorsContainer ? flavorsContainer.querySelectorAll('.sabor-input') : [];
        const flavorValues = [];
        flavorInputs.forEach(fi => {
            if (fi && fi.value) flavorValues.push(fi.value.trim());
            else flavorValues.push('');
        });
        if (flavorValues.length === 1) sabor = flavorValues[0] || '';
        else if (flavorValues.length > 1) sabor = flavorValues.join(', ');

        // ====== VALIDAÇÕES ======
        if (!nome || !telefone || !endereco) {
            if (window.Toastify) {
                Toastify({
                    text: "Preencha todos os campos obrigatórios!",
                    duration: 3500,
                    close: true,
                    gravity: "top",
                    position: "right",
                    style: { background: "#ff6b6b" }
                }).showToast();
            } else {
                alert("Preencha todos os campos obrigatórios!");
            }
            return;
        }

        if (blocoSabor.style.display === "block" && flavorValues.some(v => v === "")) {
            if (window.Toastify) {
                Toastify({
                    text: "Escolha o sabor do Pod / Essência!",
                    duration: 3500,
                    close: true,
                    gravity: "top",
                    position: "right",
                    style: { background: "#ff6b6b" }
                }).showToast();
            } else {
                alert("Escolha o sabor do Pod / Essência!");
            }
            return;
        }

        // Número do vendedor
        const numeroVendedor = "554796801207";

        let mensagem =
            `🔥 *NOVO PEDIDO* 🔥\n\n` +
            `👤 *Cliente:* ${nome}\n` +
            `📱 *WhatsApp:* ${telefone}\n` +
            `📦 *Produto:* ${produtoSelecionado}\n` +
            `🏷️ *Categoria:* ${categoriaSelecionada}\n` +
            `💸 *Preço:* ${precoSelecionado}\n` +
            `📍 *Endereço:* ${endereco}\n`;

        // Se tiver sabor
        if (blocoSabor.style.display === "block") {
            mensagem += `🍓 *Sabor:* ${sabor}\n`;
        }

        const url = `https://wa.me/${numeroVendedor}?text=${encodeURIComponent(mensagem)}`;

        // Salva o pedido no carrinho local antes de abrir o WhatsApp
        const precoNumero = parsePriceString(precoSelecionado);
        // para combo, adiciona como um item único com os sabores listados
        addAoCarrinhoComModal(produtoSelecionado, precoNumero, blocoSabor.style.display === "block" ? sabor : "");
        if (typeof showToast === "function") showToast("Pedido salvo no carrinho!");

        window.open(url, "_blank");
    } catch (err) {
        console.error(err);
        const msg = 'Erro ao processar pedido: ' + (err && err.message ? err.message : err);
        if (window.Toastify) {
            Toastify({
                text: msg,
                duration: 4500,
                close: true,
                gravity: "top",
                position: "right",
                style: { background: "#d9534f" }
            }).showToast();
        } else {
            alert(msg);
        }
    }
});


    /* ==========================================================
       ADICIONAR AO CARRINHO (caso use no futuro)
    ========================================================== */
    // Converte uma string de preço (ex: "R$ 50,00" ou "50,00") para número
    function parsePriceString(priceStr) {
        if (!priceStr) return 0;
        const cleaned = priceStr.replace(/[^\d,\.\-]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    }

    function addAoCarrinhoComModal(name, price, sabor) {
        const itemFinal = sabor ? `${name} - Sabor: ${sabor}` : name;

        let cart = JSON.parse(localStorage.getItem("cartItems")) || [];

        const found = cart.find(i => i.name === itemFinal);
        if (found) found.quantity++;
        else cart.push({ name: itemFinal, price, quantity: 1 });

        localStorage.setItem("cartItems", JSON.stringify(cart));

        if (typeof renderCart === "function") renderCart();
    }



    /* ==========================================================
       SISTEMA DE CARRINHO (SEU CÓDIGO ORIGINAL)
    ========================================================== */
    let cart = JSON.parse(localStorage.getItem("cartItems")) || [];

    const cartPanel     = document.getElementById("cart-panel");
    const cartOverlay   = document.getElementById("cart-overlay");
    const cartListEl    = document.querySelector('.cart-items');
    const cartTotalEl   = document.querySelector('.cart-total');
    const cartCountSpan = document.querySelector('.cart-count');
    const cartIcon      = document.querySelector('.cart-icon');

    const closeCartBtn  = document.querySelector('.close-cart');
    const pixModal      = document.getElementById("pix-modal");
    const closePixBtn   = document.getElementById("close-pix");

    function showToast(msg) {
        const t = document.createElement("div");
        t.className = "toast";
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(()=> t.classList.add("show"));
        setTimeout(()=> { t.classList.remove("show"); setTimeout(()=> t.remove(), 300); }, 1800);
    }

    cartIcon.addEventListener("click", () => {
        cartPanel.classList.add("active");
        cartOverlay.classList.add("active");
        renderCart();
    });

    closeCartBtn.addEventListener("click", () => {
        cartPanel.classList.remove("active");
        cartOverlay.classList.remove("active");
    });

    cartOverlay.addEventListener("click", () =>
        cartPanel.classList.remove("active")
    );

    function updateCartCount() {
        const totalQty = cart.reduce((s, it) => s + (it.quantity||0), 0);
        cartCountSpan.textContent = totalQty;
    }

    function renderCart() {
        cart = JSON.parse(localStorage.getItem("cartItems")) || [];
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
                <button class="delete-item" data-index="${idx}">🗑</button>
            `;
            cartListEl.appendChild(li);
        });

        cartTotalEl.textContent = `Total: R$ ${total.toFixed(2).replace(".", ",")}`;
        updateCartCount();
    }

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-item")) {
            const index = Number(e.target.dataset.index);
            cart.splice(index, 1);
            localStorage.setItem("cartItems", JSON.stringify(cart));
            renderCart();
            showToast("Item removido!");
        }
    });

    /* PIX (mantive igual) */
    function gerarCRC16(str) {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
            crc ^= str.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
                crc &= 0xFFFF;
            }
        }
        return crc.toString(16).toUpperCase().padStart(4, "0");
    }

    function emv(id, value) {
        return id + String(value.length).padStart(2,"0") + value;
    }

    function gerarPayloadPIX({ chave, merchant, city, amount }) {
        const gui = emv("00", "BR.GOV.BCB.PIX") + emv("01", chave);
        const merchantAccount = emv("26", gui);
        const merchantInfo = emv("52", "0000") + emv("53", "986") + emv("54", amount) + emv("58", "BR") + emv("59", merchant) + emv("60", city);
        const additional = emv("62", emv("05", "***"));
        const payloadSemCRC = "000201010212" + merchantAccount + merchantInfo + additional + "6304";
        return payloadSemCRC + gerarCRC16(payloadSemCRC);
    }

    function gerarCodigoPIX(valor) {
        return gerarPayloadPIX({
            chave: "+5547984728108",
            merchant: "Vaporize Store",
            city: "MACEIO",
            amount: valor.toFixed(2)
        });
    }

    document.addEventListener("click", (e) => {
        if (e.target.id === "checkout-btn") {
            const total = cart.reduce((s,i) => s + i.price * i.quantity, 0);

            if (!total) return showToast("Carrinho vazio!");

            const codigo = gerarCodigoPIX(total);

            pixModal.classList.add("active");
            document.querySelector(".pix-value").textContent =
                `Valor: R$ ${total.toFixed(2).replace(".", ",")}`;

            document.getElementById("pix-code").value = codigo;

            const canvas = document.getElementById("pix-qrcode-canvas");
            if (window.QRCode && canvas) {
                QRCode.toCanvas(canvas, codigo).catch(()=>{});
            }
        }
    });

    closePixBtn.addEventListener("click", () =>
        pixModal.classList.remove("active")
    );

    document.getElementById("copy-pix")?.addEventListener("click", () => {
        const txt = document.getElementById("pix-code");
        txt.select();
        navigator.clipboard.writeText(txt.value).then(()=> showToast("Código PIX copiado!"));
    });

    renderCart();
    
    // ======= HANDLERS PARA BOTÕES DE PROMOÇÕES (ABREM O MODAL PARA ESCOLHA DE SABORES) =======
    document.querySelectorAll('.promo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.promo-card');
            if (!card) return;

            produtoSelecionado = card.querySelector('h3')?.textContent.trim() || 'Promoção';
            const priceEl = card.querySelector('.price-promo')?.textContent || card.querySelector('.price-original')?.textContent || 'R$ 0,00';
            precoSelecionado = priceEl;
            categoriaSelecionada = 'promo';

            if (card.classList.contains('promo-combo')) {
                // Combo 2 por preço: pedir 2 sabores
                createFlavorInputs(2);
                isCombo = true;
            } else {
                // Promoção normal: permitir 1 sabor (quando aplicável)
                createFlavorInputs(1);
                isCombo = false;
            }

            modal.style.display = 'flex';
        });
    });
// =============== CARROSSEL AUTOMÁTICO + ARRASTAR =====================

// Pegando elementos
const carouselContainer = document.querySelector(".carousel-container");
const carouselTrack = document.querySelector(".carousel-track");

// Velocidade do autoplay
let autoPlaySpeed = 3000; // 3 segundos

// Função AutoPlay
function autoPlayCarousel() {
    const itemWidth = carouselTrack.children[0].offsetWidth + 16; // largura + gap
    carouselContainer.scrollLeft += itemWidth;

    // Se chegar ao final, volta ao início
    if (carouselContainer.scrollLeft + carouselContainer.offsetWidth >= carouselContainer.scrollWidth - 5) {
        carouselContainer.scrollLeft = 0;
    }
}

// Iniciar autoplay
let autoPlayInterval = setInterval(autoPlayCarousel, autoPlaySpeed);

// Pausar autoplay quando o usuário interagir
carouselContainer.addEventListener("mouseenter", () => clearInterval(autoPlayInterval));
carouselContainer.addEventListener("mouseleave", () => {
    autoPlayInterval = setInterval(autoPlayCarousel, autoPlaySpeed);
});

// =============== ARRASTAR COM MOUSE E DEDO =====================

let isDown = false;
let startX;
let scrollLeft;

// Mouse
carouselContainer.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - carouselContainer.offsetLeft;
    scrollLeft = carouselContainer.scrollLeft;
    carouselContainer.classList.add("active");
});

carouselContainer.addEventListener("mouseleave", () => {
    isDown = false;
    carouselContainer.classList.remove("active");
});

carouselContainer.addEventListener("mouseup", () => {
    isDown = false;
    carouselContainer.classList.remove("active");
});

carouselContainer.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carouselContainer.offsetLeft;
    const walk = (x - startX) * 1.5; 
    carouselContainer.scrollLeft = scrollLeft - walk;
});

// Touch (celular)
carouselContainer.addEventListener("touchstart", (e) => {
    isDown = true;
    startX = e.touches[0].pageX - carouselContainer.offsetLeft;
    scrollLeft = carouselContainer.scrollLeft;
});

carouselContainer.addEventListener("touchend", () => {
    isDown = false;
});

carouselContainer.addEventListener("touchmove", (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - carouselContainer.offsetLeft;
    const walk = (x - startX) * 1.5;
    carouselContainer.scrollLeft = scrollLeft - walk;
});
