(function () {
  "use strict";

  // Which shop to show: /?shop=<slug>  — falls back to the demo shop so the
  // template is browsable the moment it's deployed.
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("shop") || "fashion-hub";

  const els = {
    header: document.getElementById("shopHeader"),
    logo: document.getElementById("shopLogo"),
    name: document.getElementById("shopName"),
    meta: document.getElementById("shopMeta"),
    socials: document.getElementById("shopSocials"),
    tabs: document.getElementById("categoryTabs"),
    grid: document.getElementById("productGrid"),
  };

  const ICONS = {
    phone:
      '<svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.7 5.1 6.5 6.5l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1v3.4c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4.2c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1z"/></svg>',
    pin:
      '<svg viewBox="0 0 24 24"><path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 7 11.5 7.3 11.7.2.2.5.3.7.3s.5-.1.7-.3C13 21.5 20 15.4 20 10c0-4.4-3.6-8-8-8zm0 10.8c-1.5 0-2.8-1.3-2.8-2.8S10.5 7.2 12 7.2s2.8 1.3 2.8 2.8-1.3 2.8-2.8 2.8z"/></svg>',
    camera:
      '<svg viewBox="0 0 24 24"><path d="M9 3l-1.6 2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.4L15 3H9zm3 5.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zm0 2a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/></svg>',
    letterF:
      '<svg viewBox="0 0 24 24"><path d="M15 4h-2c-2.2 0-3.5 1.4-3.5 3.6V10H7v3h2.5v7h3v-7h2.6l.4-3h-3V7.9c0-.7.3-1.2 1.3-1.2H15V4z"/></svg>',
    link:
      '<svg viewBox="0 0 24 24"><path d="M10.6 13.4a1 1 0 010-1.4l3-3a1 1 0 111.4 1.4l-3 3a1 1 0 01-1.4 0zM8.3 15.7l-1.4 1.4a3 3 0 01-4.2-4.2l3-3a3 3 0 014.2 0 1 1 0 11-1.4 1.4 1 1 0 00-1.4 0l-3 3a1 1 0 001.4 1.4l1.4-1.4a1 1 0 111.4 1.4zm7.4-7.4l1.4-1.4a3 3 0 014.2 4.2l-3 3a3 3 0 01-4.2 0 1 1 0 111.4-1.4 1 1 0 001.4 0l3-3a1 1 0 00-1.4-1.4l-1.4 1.4a1 1 0 11-1.4-1.4z"/></svg>',
    whatsapp:
      '<svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.5.1-.2 0-.3 0-.5-.1-.1-.6-1.4-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.7 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.3 0-.1-.2-.2-.4-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.4 5.1L2 22l5.1-1.3A9.9 9.9 0 0012 22c5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>',
  };

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    for (const child of children) {
      if (child == null) continue;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return node;
  }

  function formatPrice(n) {
    return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }

  function renderHeader(shop) {
    if (shop.logo_url) {
      els.logo.src = shop.logo_url;
      els.logo.alt = shop.name + " logo";
      els.logo.hidden = false;
    }
    els.name.textContent = shop.name;
    document.title = shop.name + " — Catalogue";

    els.meta.innerHTML = "";
    if (shop.phone) {
      els.meta.appendChild(
        el("a", { href: `tel:${shop.phone.replace(/\s+/g, "")}`, html: ICONS.phone }, " " + shop.phone)
      );
    }
    if (shop.address) {
      els.meta.appendChild(el("span", { style: "display:inline-flex;align-items:center;gap:6px;" }, ICONS.pinNode(), " " + shop.address));
    }

    els.socials.innerHTML = "";
    const socialLinks = [
      [shop.instagram_url, ICONS.camera, "Instagram"],
      [shop.facebook_url, ICONS.letterF, "Facebook"],
      [shop.other_social_url, ICONS.link, "More links"],
    ];
    for (const [url, icon, label] of socialLinks) {
      if (!url) continue;
      els.socials.appendChild(el("a", { href: url, target: "_blank", rel: "noopener", "aria-label": label, html: icon }));
    }
  }

  // Small helper since address needs an icon node too (innerHTML approach above is simplified).
  ICONS.pinNode = function () {
    const span = document.createElement("span");
    span.innerHTML = ICONS.pin;
    return span.firstChild;
  };

  let activeCategoryId = "all";
  let allProducts = [];
  let allCategories = [];

  function renderTabs() {
    els.tabs.innerHTML = "";
    const tabs = [{ id: "all", name: "All" }, ...allCategories];
    for (const cat of tabs) {
      const btn = el(
        "button",
        { class: "category-tab" + (String(cat.id) === String(activeCategoryId) ? " is-active" : "") },
        cat.name
      );
      btn.addEventListener("click", () => {
        activeCategoryId = cat.id;
        renderTabs();
        renderGrid();
      });
      els.tabs.appendChild(btn);
    }
  }

  function buildGallery(product) {
    const images = product.images && product.images.length ? product.images : ["/img/placeholder.svg"];
    const wrap = el("div", { class: "gallery" });
    const track = el("div", { class: "gallery__track" });
    images.forEach((src) => {
      track.appendChild(el("div", { class: "gallery__slide" }, el("img", { src, alt: product.name, loading: "lazy" })));
    });
    wrap.appendChild(track);

    let index = 0;
    let dots = [];
    function goTo(i) {
      index = (i + images.length) % images.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle("is-active", di === index));
    }

    if (images.length > 1) {
      const prev = el("button", { class: "gallery__arrow gallery__arrow--prev", "aria-label": "Previous image" }, "\u2039");
      const next = el("button", { class: "gallery__arrow gallery__arrow--next", "aria-label": "Next image" }, "\u203A");
      prev.addEventListener("click", () => goTo(index - 1));
      next.addEventListener("click", () => goTo(index + 1));
      wrap.appendChild(prev);
      wrap.appendChild(next);

      const dotsWrap = el("div", { class: "gallery__dots" });
      dots = images.map((_, i) => {
        const d = el("span", { class: "gallery__dot" + (i === 0 ? " is-active" : "") });
        dotsWrap.appendChild(d);
        return d;
      });
      wrap.appendChild(dotsWrap);

      // Touch swipe
      let startX = 0;
      let dx = 0;
      wrap.addEventListener(
        "touchstart",
        (e) => {
          startX = e.touches[0].clientX;
          dx = 0;
          track.style.transition = "none";
        },
        { passive: true }
      );
      wrap.addEventListener(
        "touchmove",
        (e) => {
          dx = e.touches[0].clientX - startX;
          track.style.transform = `translateX(calc(-${index * 100}% + ${dx}px))`;
        },
        { passive: true }
      );
      wrap.addEventListener("touchend", () => {
        track.style.transition = "";
        if (Math.abs(dx) > 40) {
          goTo(index + (dx < 0 ? 1 : -1));
        } else {
          goTo(index);
        }
      });
    }

    return wrap;
  }

  function buildCard(product) {
    const card = el("div", { class: "product-card" });
    card.appendChild(buildGallery(product));

    if (product.quantity_available <= 0) {
      card.appendChild(el("span", { class: "stock-badge" }, "Out of stock"));
    }

    const body = el("div", { class: "product-card__body" });
    body.appendChild(el("p", { class: "product-card__name" }, product.name));
    body.appendChild(
      el(
        "div",
        { class: "product-card__price-row" },
        el("span", { class: "product-card__price" }, formatPrice(product.price)),
        el(
          "span",
          { class: "product-card__qty" },
          product.quantity_available > 0 ? `${product.quantity_available} available` : ""
        )
      )
    );

    const inStock = product.quantity_available > 0;
    const orderBtn = el(
      "button",
      { class: "order-btn" },
      ICONS.whatsappNode(),
      inStock ? "Order Now" : "Out of stock"
    );
    orderBtn.disabled = !inStock;
    if (inStock) {
      orderBtn.addEventListener("click", () => {
        const message = `Hi! I'd like to order: ${product.name} (${formatPrice(product.price)})`;
        const url = `https://wa.me/${window.__shopWhatsapp}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank", "noopener");
      });
    }
    body.appendChild(orderBtn);
    card.appendChild(body);
    return card;
  }

  ICONS.whatsappNode = function () {
    const span = document.createElement("span");
    span.innerHTML = ICONS.whatsapp;
    return span.firstChild;
  };

  function renderGrid() {
    els.grid.innerHTML = "";
    const filtered =
      activeCategoryId === "all"
        ? allProducts
        : allProducts.filter((p) => String(p.category_id) === String(activeCategoryId));

    if (!filtered.length) {
      els.grid.appendChild(el("div", { class: "empty-state" }, "No products in this category yet."));
      return;
    }
    filtered.forEach((p) => els.grid.appendChild(buildCard(p)));
  }

  async function init() {
    try {
      const res = await fetch(`/api/shop/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("not found");
      const data = await res.json();

      window.__shopWhatsapp = (data.shop.whatsapp_number || "").replace(/\D/g, "");
      renderHeader(data.shop);
      allCategories = data.categories || [];
      allProducts = data.products || [];
      renderTabs();
      renderGrid();
    } catch (err) {
      els.name.textContent = "Shop not found";
      els.grid.innerHTML = "";
      els.grid.appendChild(
        el("div", { class: "empty-state" }, "We couldn't find this shop's catalogue. Please check the link.")
      );
    }
  }

  init();
})();
