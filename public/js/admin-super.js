(function () {
  "use strict";
  const { api, el, toast, logout } = window.AdminCommon;

  const loginScreen = document.getElementById("loginScreen");
  const app = document.getElementById("app");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");

  let shops = [];
  let selectedShopId = null;
  let categories = [];
  let products = [];

  async function boot() {
    try {
      const me = await api("/api/auth/me");
      if (me.role !== "super_admin") throw new Error("wrong role");
      document.getElementById("whoAmI").textContent = me.email;
      loginScreen.hidden = true;
      app.hidden = false;
      await loadShops();
    } catch {
      loginScreen.hidden = false;
      app.hidden = true;
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("email").value,
          password: document.getElementById("password").value,
        }),
      });
      await boot();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.hidden = false;
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => logout("/admin/super/"));

  document.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      document.getElementById("tab-shops").hidden = btn.dataset.tab !== "shops";
      document.getElementById("tab-catalogue").hidden = btn.dataset.tab !== "catalogue";
    });
  });

  // ---------- Shops ----------
  async function loadShops() {
    const res = await api("/api/admin/shops");
    shops = res.shops;
    renderShops();
    renderShopSelect();
  }

  function renderShops() {
    const list = document.getElementById("shopList");
    list.innerHTML = "";
    if (!shops.length) {
      list.appendChild(el("div", { class: "empty-hint" }, "No shops yet. Onboard your first client above."));
      return;
    }
    shops.forEach((s) => {
      const viewLink = el("a", { href: `/?shop=${encodeURIComponent(s.slug)}`, target: "_blank", class: "btn btn-ghost btn-small" }, "View");
      const editBtn = el("button", { class: "btn btn-ghost btn-small" }, "Edit");
      editBtn.addEventListener("click", () => openShopModal(s));
      const delBtn = el("button", { class: "btn btn-danger btn-small" }, "Delete");
      delBtn.addEventListener("click", () => deleteShop(s));

      list.appendChild(
        el(
          "div",
          { class: "list-row" },
          el(
            "div",
            { class: "list-row__main" },
            el("p", { class: "list-row__title" }, s.name + (s.is_active ? "" : "  (inactive)")),
            el("p", { class: "list-row__sub" }, `/?shop=${s.slug}`)
          ),
          el("div", { class: "list-row__actions" }, viewLink, editBtn, delBtn)
        )
      );
    });
  }

  function renderShopSelect() {
    const select = document.getElementById("shopSelect");
    select.innerHTML = "";
    select.appendChild(el("option", { value: "" }, "Choose a shop\u2026"));
    shops.forEach((s) => select.appendChild(el("option", { value: s.id }, s.name)));
    select.value = selectedShopId || "";
  }

  document.getElementById("shopSelect").addEventListener("change", async (e) => {
    selectedShopId = e.target.value || null;
    const manager = document.getElementById("catalogueManager");
    if (!selectedShopId) {
      manager.hidden = true;
      return;
    }
    manager.hidden = false;
    await loadCatalogue();
  });

  document.getElementById("addShopBtn").addEventListener("click", () => openShopModal(null));

  function shopField(label, input) {
    return el("div", { class: "field" }, el("label", {}, label), input);
  }

  function openShopModal(shop) {
    const isEdit = !!shop;
    const overlay = el("div", { class: "modal-overlay" });

    const nameInput = el("input", { type: "text", value: shop ? shop.name : "", placeholder: "e.g. Fashion Hub" });
    const phoneInput = el("input", { type: "text", value: shop ? shop.phone || "" : "", placeholder: "+91 98765 43210" });
    const addressInput = el("textarea", { rows: "2", placeholder: "Shop address" }, shop ? shop.address || "" : "");
    const whatsappInput = el("input", { type: "text", value: shop ? shop.whatsapp_number || "" : "", placeholder: "919876543210 (country code, no +)" });
    const instaInput = el("input", { type: "url", value: shop ? shop.instagram_url || "" : "", placeholder: "https://instagram.com/..." });
    const fbInput = el("input", { type: "url", value: shop ? shop.facebook_url || "" : "", placeholder: "https://facebook.com/..." });
    const otherInput = el("input", { type: "url", value: shop ? shop.other_social_url || "" : "", placeholder: "https://..." });
    const logoInput = el("input", { type: "url", value: shop ? shop.logo_url || "" : "", placeholder: "https://... (paste a hosted logo URL)" });

    let emailInput, passwordInput, slugInput;
    const fields = [
      shopField("Shop name", nameInput),
      shopField("Phone (click-to-call)", phoneInput),
      shopField("Address", addressInput),
      shopField("WhatsApp number", whatsappInput),
      shopField("Instagram URL", instaInput),
      shopField("Facebook URL", fbInput),
      shopField("Other social URL", otherInput),
      shopField("Logo image URL", logoInput),
    ];

    if (!isEdit) {
      slugInput = el("input", { type: "text", placeholder: "auto-generated from name if left blank" });
      emailInput = el("input", { type: "email", placeholder: "owner@shop.example" });
      passwordInput = el("input", { type: "text", placeholder: "Temporary password for the shop owner" });
      fields.push(
        shopField("Catalogue link (slug)", slugInput),
        shopField("Shop owner login email", emailInput),
        shopField("Shop owner temporary password", passwordInput)
      );
    }

    const saveBtn = el("button", { class: "btn btn-primary" }, isEdit ? "Save changes" : "Create shop");
    const cancelBtn = el("button", { class: "btn btn-ghost" }, "Cancel");
    cancelBtn.addEventListener("click", () => overlay.remove());

    saveBtn.addEventListener("click", async () => {
      const payload = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        address: addressInput.value.trim(),
        whatsapp_number: whatsappInput.value.replace(/\D/g, ""),
        instagram_url: instaInput.value.trim() || null,
        facebook_url: fbInput.value.trim() || null,
        other_social_url: otherInput.value.trim() || null,
        logo_url: logoInput.value.trim() || null,
      };
      if (!payload.name) return toast("Please enter a shop name", true);

      saveBtn.disabled = true;
      saveBtn.textContent = "Saving\u2026";
      try {
        if (isEdit) {
          await api(`/api/admin/shops/${shop.id}`, { method: "PUT", body: JSON.stringify(payload) });
        } else {
          if (!emailInput.value.trim() || !passwordInput.value.trim()) {
            throw new Error("Please provide a login email and password for the shop owner");
          }
          payload.slug = slugInput.value.trim() || undefined;
          payload.admin_email = emailInput.value.trim();
          payload.admin_password = passwordInput.value.trim();
          await api("/api/admin/shops", { method: "POST", body: JSON.stringify(payload) });
        }
        toast(isEdit ? "Shop updated" : "Shop created");
        overlay.remove();
        await loadShops();
      } catch (err) {
        toast(err.message, true);
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? "Save changes" : "Create shop";
      }
    });

    const actions = [cancelBtn, saveBtn];
    if (isEdit) {
      const toggleBtn = el("button", { class: "btn btn-ghost" }, shop.is_active ? "Deactivate" : "Reactivate");
      toggleBtn.addEventListener("click", async () => {
        try {
          await api(`/api/admin/shops/${shop.id}`, {
            method: "PUT",
            body: JSON.stringify({ is_active: shop.is_active ? 0 : 1 }),
          });
          toast(shop.is_active ? "Shop deactivated" : "Shop reactivated");
          overlay.remove();
          await loadShops();
        } catch (err) {
          toast(err.message, true);
        }
      });
      actions.unshift(toggleBtn);
    }

    const card = el(
      "div",
      { class: "modal-card" },
      el("h2", {}, isEdit ? `Edit ${shop.name}` : "Onboard a new shop"),
      ...fields,
      el("div", { class: "modal-actions" }, ...actions)
    );
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  async function deleteShop(s) {
    if (!confirm(`Permanently delete "${s.name}" and all its products/categories? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/shops/${s.id}`, { method: "DELETE" });
      toast("Shop deleted");
      if (selectedShopId === String(s.id)) selectedShopId = null;
      await loadShops();
    } catch (err) {
      toast(err.message, true);
    }
  }

  // ---------- Catalogue (products/categories) for the selected shop ----------
  async function loadCatalogue() {
    const [catRes, prodRes] = await Promise.all([
      api(`/api/categories?shop_id=${selectedShopId}`),
      api(`/api/products?shop_id=${selectedShopId}`),
    ]);
    categories = catRes.categories;
    products = prodRes.products;
    renderCategories();
    renderProducts();
  }

  function categoryName(id) {
    const c = categories.find((c) => String(c.id) === String(id));
    return c ? c.name : "Uncategorized";
  }

  function renderProducts() {
    const list = document.getElementById("productList");
    list.innerHTML = "";
    if (!products.length) {
      list.appendChild(el("div", { class: "empty-hint" }, "No products yet for this shop."));
      return;
    }
    products.forEach((p) => {
      const editBtn = el("button", { class: "btn btn-ghost btn-small" }, "Edit");
      editBtn.addEventListener("click", () => openProductModal(p));
      const delBtn = el("button", { class: "btn btn-danger btn-small" }, "Delete");
      delBtn.addEventListener("click", () => deleteProduct(p));

      list.appendChild(
        el(
          "div",
          { class: "list-row" },
          el("img", { class: "thumb", src: (p.images && p.images[0]) || "/img/placeholder.svg", alt: "" }),
          el(
            "div",
            { class: "list-row__main" },
            el("p", { class: "list-row__title" }, p.name),
            el("p", { class: "list-row__sub" }, `\u20B9${p.price} · ${p.quantity_available} in stock · ${categoryName(p.category_id)}`)
          ),
          el("div", { class: "list-row__actions" }, editBtn, delBtn)
        )
      );
    });
  }

  async function deleteProduct(p) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await api(`/api/products/${p.id}`, { method: "DELETE" });
      toast("Product deleted");
      await loadCatalogue();
    } catch (err) {
      toast(err.message, true);
    }
  }

  document.getElementById("addProductBtn").addEventListener("click", () => {
    if (!selectedShopId) return toast("Select a shop first", true);
    openProductModal(null);
  });

  function openProductModal(product) {
    const isEdit = !!product;
    let uploadedImages = product ? [...product.images] : [];

    const overlay = el("div", { class: "modal-overlay" });
    const catOptions = categories.map((c) =>
      el("option", { value: c.id, selected: product && String(product.category_id) === String(c.id) ? "true" : null }, c.name)
    );

    const nameInput = el("input", { type: "text", value: product ? product.name : "", placeholder: "Product name" });
    const priceInput = el("input", { type: "number", min: "0", step: "1", value: product ? product.price : "" });
    const qtyInput = el("input", { type: "number", min: "0", step: "1", value: product ? product.quantity_available : "0" });
    const catSelect = el("select", {}, el("option", { value: "" }, "No category"), ...catOptions);

    const uploaderItems = el("div", { class: "image-uploader" });
    const addTile = el(
      "div",
      { class: "image-uploader__add" },
      "+",
      el("input", { type: "file", accept: "image/*", multiple: "true" })
    );

    function renderThumbs() {
      uploaderItems.innerHTML = "";
      uploadedImages.forEach((src, i) => {
        const removeBtn = el("button", { class: "image-uploader__remove", type: "button" }, "\u00D7");
        removeBtn.addEventListener("click", () => {
          uploadedImages.splice(i, 1);
          renderThumbs();
        });
        uploaderItems.appendChild(el("div", { class: "image-uploader__item" }, el("img", { src }), removeBtn));
      });
      uploaderItems.appendChild(addTile);
    }
    renderThumbs();

    const fileInput = addTile.querySelector("input");
    fileInput.addEventListener("change", async () => {
      const files = Array.from(fileInput.files || []);
      fileInput.value = "";
      for (const file of files) {
        try {
          toast("Uploading photo\u2026");
          const compressed = await window.compressImage(file);
          const form = new FormData();
          form.append("file", compressed);
          const res = await api("/api/upload", { method: "POST", body: form });
          uploadedImages.push(res.url);
          renderThumbs();
        } catch (err) {
          toast(err.message, true);
        }
      }
    });

    const saveBtn = el("button", { class: "btn btn-primary" }, isEdit ? "Save changes" : "Add product");
    const cancelBtn = el("button", { class: "btn btn-ghost" }, "Cancel");
    cancelBtn.addEventListener("click", () => overlay.remove());

    saveBtn.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const price = Number(priceInput.value);
      const quantity = Number(qtyInput.value);
      if (!name) return toast("Please enter a product name", true);
      if (!Number.isFinite(price) || price < 0) return toast("Please enter a valid price", true);

      const payload = {
        shop_id: selectedShopId,
        name,
        price,
        quantity_available: Number.isFinite(quantity) ? quantity : 0,
        category_id: catSelect.value || null,
        images: uploadedImages,
      };

      saveBtn.disabled = true;
      saveBtn.textContent = "Saving\u2026";
      try {
        if (isEdit) {
          await api(`/api/products/${product.id}`, { method: "PUT", body: JSON.stringify(payload) });
        } else {
          await api("/api/products", { method: "POST", body: JSON.stringify(payload) });
        }
        toast(isEdit ? "Product updated" : "Product added");
        overlay.remove();
        await loadCatalogue();
      } catch (err) {
        toast(err.message, true);
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? "Save changes" : "Add product";
      }
    });

    const card = el(
      "div",
      { class: "modal-card" },
      el("h2", {}, isEdit ? "Edit product" : "Add product"),
      el("div", { class: "field" }, el("label", {}, "Product name"), nameInput),
      el("div", { class: "field" }, el("label", {}, "Price (\u20B9)"), priceInput),
      el("div", { class: "field" }, el("label", {}, "Quantity available"), qtyInput),
      el("div", { class: "field" }, el("label", {}, "Category"), catSelect),
      el("div", { class: "field" }, el("label", {}, "Photos"), uploaderItems),
      el("div", { class: "modal-actions" }, cancelBtn, saveBtn)
    );
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function renderCategories() {
    const list = document.getElementById("categoryList");
    list.innerHTML = "";
    if (!categories.length) {
      list.appendChild(el("div", { class: "empty-hint" }, "No categories yet for this shop."));
      return;
    }
    categories
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((c, i, arr) => {
        const upBtn = el("button", { class: "btn btn-ghost btn-small" }, "\u2191");
        const downBtn = el("button", { class: "btn btn-ghost btn-small" }, "\u2193");
        upBtn.disabled = i === 0;
        downBtn.disabled = i === arr.length - 1;
        upBtn.addEventListener("click", () => swapOrder(arr, i, i - 1));
        downBtn.addEventListener("click", () => swapOrder(arr, i, i + 1));

        const editBtn = el("button", { class: "btn btn-ghost btn-small" }, "Rename");
        editBtn.addEventListener("click", () => renameCategory(c));
        const delBtn = el("button", { class: "btn btn-danger btn-small" }, "Delete");
        delBtn.addEventListener("click", () => deleteCategory(c));

        list.appendChild(
          el(
            "div",
            { class: "list-row" },
            el("div", { class: "list-row__main" }, el("p", { class: "list-row__title" }, c.name)),
            el("div", { class: "list-row__actions" }, upBtn, downBtn, editBtn, delBtn)
          )
        );
      });
  }

  async function swapOrder(arr, i, j) {
    const a = arr[i];
    const b = arr[j];
    try {
      await Promise.all([
        api(`/api/categories/${a.id}`, { method: "PUT", body: JSON.stringify({ sort_order: b.sort_order }) }),
        api(`/api/categories/${b.id}`, { method: "PUT", body: JSON.stringify({ sort_order: a.sort_order }) }),
      ]);
      await loadCatalogue();
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function renameCategory(c) {
    const name = prompt("Category name", c.name);
    if (!name || !name.trim() || name.trim() === c.name) return;
    try {
      await api(`/api/categories/${c.id}`, { method: "PUT", body: JSON.stringify({ name: name.trim() }) });
      toast("Category updated");
      await loadCatalogue();
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function deleteCategory(c) {
    if (!confirm(`Delete category "${c.name}"? Products in it will become uncategorized.`)) return;
    try {
      await api(`/api/categories/${c.id}`, { method: "DELETE" });
      toast("Category deleted");
      await loadCatalogue();
    } catch (err) {
      toast(err.message, true);
    }
  }

  document.getElementById("addCategoryBtn").addEventListener("click", async () => {
    if (!selectedShopId) return toast("Select a shop first", true);
    const name = prompt("New category name");
    if (!name || !name.trim()) return;
    try {
      await api("/api/categories", {
        method: "POST",
        body: JSON.stringify({ shop_id: selectedShopId, name: name.trim(), sort_order: categories.length }),
      });
      toast("Category added");
      await loadCatalogue();
    } catch (err) {
      toast(err.message, true);
    }
  });

  boot();
})();
