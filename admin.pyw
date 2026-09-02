import os
import json
import time
import shutil
import subprocess
import webbrowser
import tkinter as tk
from tkinter import filedialog, messagebox
import customtkinter as ctk

# Módulo auxiliar de reportes automatizados (Excel, PDF y Web Estática)
try:
    from reportes import generar_excel_productos, generar_catalogo_pdf, generar_pagina_web_estatica, _normalizar_producto
    REPORTES_DISPONIBLE = True
except ImportError:
    REPORTES_DISPONIBLE = False

# Configuración del tema visual CustomTkinter
ctk.set_appearance_mode("System")  # Modo claro/oscuro automático según Windows
ctk.set_default_color_theme("blue")

class HWAndeviaAdminApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("HW-Andevia Repuestos - Panel de Control PC")
        self.geometry("950x680")
        self.minsize(850, 600)

        # Rutas locales vinculadas a la carpeta public de React/Vite
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.public_dir = os.path.join(self.script_dir, "public")
        self.json_path = os.path.join(self.public_dir, "productos.json")
        self.imagenes_dir = os.path.join(self.public_dir, "imagenes")

        # Asegurar directorios de la carpeta public
        os.makedirs(self.public_dir, exist_ok=True)
        os.makedirs(self.imagenes_dir, exist_ok=True)

        self.productos = []
        self.cargar_productos()

        # Índice del producto que se está editando actualmente (None si es nuevo)
        self.producto_editando_idx = None

        # Historial para Deshacer/Rehacer (hasta 15 estados)
        self.history_undo = []
        self.history_redo = []
        self.max_history = 15

        # Imagen seleccionada temporalmente
        self.temp_image_path = None

        # INTERFAZ GRÁFICA
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # PANELES
        self.crear_sidebar_formulario()
        self.crear_panel_lista()

    def cargar_productos(self):
        """Carga la lista de productos desde public/productos.json"""
        ruta_origen = self.json_path
        if os.path.exists(ruta_origen):
            try:
                with open(ruta_origen, "r", encoding="utf-8") as f:
                    self.productos = json.load(f)
                
                # Normalizar rutas de imágenes a /imagenes/...
                for p in self.productos:
                    img = p.get("imageUrl", "")
                    if img and not img.startswith("/") and not img.startswith("http"):
                        p["imageUrl"] = f"/{img.lstrip('/')}"
            except Exception as e:
                messagebox.showerror("Error", f"No se pudo leer el archivo de productos:\n{e}")
                self.productos = []
        else:
            self.productos = []

    def guardar_productos(self):
        """Guarda la lista actual de productos en public/productos.json"""
        try:
            with open(self.json_path, "w", encoding="utf-8") as f:
                json.dump(self.productos, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo guardar public/productos.json:\n{e}")
            return False

    def registrar_historial(self):
        """Guarda una copia del catálogo actual en la pila de deshacer (máx 15)"""
        import copy
        self.history_undo.append(copy.deepcopy(self.productos))
        if len(self.history_undo) > self.max_history:
            self.history_undo.pop(0)
        self.history_redo.clear()

    def deshacer(self):
        """Deshace la última acción en el catálogo"""
        if not self.history_undo:
            messagebox.showinfo("Deshacer", "No hay cambios previos para deshacer.")
            return
        import copy
        self.history_redo.append(copy.deepcopy(self.productos))
        if len(self.history_redo) > self.max_history:
            self.history_redo.pop(0)

        self.productos = self.history_undo.pop()
        self.cancelar_edicion()
        self.guardar_productos()
        self.actualizar_lista_ui()

    def rehacer(self):
        """Rehace la última acción deshecha en el catálogo"""
        if not self.history_redo:
            messagebox.showinfo("Rehacer", "No hay cambios para rehacer.")
            return
        import copy
        self.history_undo.append(copy.deepcopy(self.productos))
        if len(self.history_undo) > self.max_history:
            self.history_undo.pop(0)

        self.productos = self.history_redo.pop()
        self.cancelar_edicion()
        self.guardar_productos()
        self.actualizar_lista_ui()

    def crear_sidebar_formulario(self):
        """Panel izquierdo con formulario intuitivo sin ID ni SKU manuales"""
        self.sidebar = ctk.CTkFrame(self, width=320, corner_radius=15)
        self.sidebar.grid(row=0, column=0, padx=15, pady=15, sticky="nsew")

        # Título del formulario
        self.lbl_form_titulo = ctk.CTkLabel(
            self.sidebar, 
            text="⚙️ Añadir Repuesto", 
            font=ctk.CTkFont(size=20, weight="bold")
        )
        self.lbl_form_titulo.pack(padx=15, pady=(20, 10))

        # Nombre del producto
        self.entry_nombre = ctk.CTkEntry(self.sidebar, placeholder_text="Nombre del repuesto (ej: Pistón Kit)")
        self.entry_nombre.pack(padx=15, pady=5, fill="x")

        # Marca
        self.entry_marca = ctk.CTkEntry(self.sidebar, placeholder_text="Marca (ej: TVS, Bajaj, Universal)")
        self.entry_marca.pack(padx=15, pady=5, fill="x")

        # Categoría
        self.entry_cat = ctk.CTkEntry(self.sidebar, placeholder_text="Categoría (ej: Motor, Frenos, Transmisión)")
        self.entry_cat.pack(padx=15, pady=5, fill="x")

        # Costos Iniciales (para control interno / Excel)
        lbl_costo = ctk.CTkLabel(self.sidebar, text="Costos Iniciales (Solo Excel/Interno):", font=ctk.CTkFont(size=12, weight="bold"))
        lbl_costo.pack(padx=15, pady=(5, 0), anchor="w")

        frame_costos = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        frame_costos.pack(padx=15, pady=(2, 5), fill="x")

        self.entry_costo_original = ctk.CTkEntry(frame_costos, placeholder_text="Costo Orig S/", width=130)
        self.entry_costo_original.pack(side="left", padx=(0, 5))

        self.entry_costo_alt = ctk.CTkEntry(frame_costos, placeholder_text="Costo Alt S/", width=130)
        self.entry_costo_alt.pack(side="right", padx=(5, 0))

        # Precios al por Menor
        lbl_p_menor = ctk.CTkLabel(self.sidebar, text="Precios al por Menor (S/):", font=ctk.CTkFont(size=12, weight="bold"))
        lbl_p_menor.pack(padx=15, pady=(5, 0), anchor="w")

        frame_precios = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        frame_precios.pack(padx=15, pady=(2, 5), fill="x")

        self.entry_precio_oem = ctk.CTkEntry(frame_precios, placeholder_text="Menor OEM S/", width=130)
        self.entry_precio_oem.pack(side="left", padx=(0, 5))

        self.entry_precio_alt = ctk.CTkEntry(frame_precios, placeholder_text="Menor Alt S/", width=130)
        self.entry_precio_alt.pack(side="right", padx=(5, 0))

        # Precios al por Mayor
        lbl_p_mayor = ctk.CTkLabel(self.sidebar, text="Precios al por Mayor (S/):", font=ctk.CTkFont(size=12, weight="bold"))
        lbl_p_mayor.pack(padx=15, pady=(5, 0), anchor="w")

        frame_precios_mayor = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        frame_precios_mayor.pack(padx=15, pady=(2, 5), fill="x")

        self.entry_precio_mayor_oem = ctk.CTkEntry(frame_precios_mayor, placeholder_text="Mayor OEM S/", width=130)
        self.entry_precio_mayor_oem.pack(side="left", padx=(0, 5))

        self.entry_precio_mayor_alt = ctk.CTkEntry(frame_precios_mayor, placeholder_text="Mayor Alt S/", width=130)
        self.entry_precio_mayor_alt.pack(side="right", padx=(5, 0))

        # Stocks
        lbl_stocks = ctk.CTkLabel(self.sidebar, text="Stock Disponible:", font=ctk.CTkFont(size=12, weight="bold"))
        lbl_stocks.pack(padx=15, pady=(5, 0), anchor="w")

        frame_stocks = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        frame_stocks.pack(padx=15, pady=(2, 5), fill="x")

        self.entry_stock_oem = ctk.CTkEntry(frame_stocks, placeholder_text="Stock OEM", width=130)
        self.entry_stock_oem.pack(side="left", padx=(0, 5))

        self.entry_stock_alt = ctk.CTkEntry(frame_stocks, placeholder_text="Stock Alt", width=130)
        self.entry_stock_alt.pack(side="right", padx=(5, 0))

        # SKU (Único)
        self.entry_sku = ctk.CTkEntry(self.sidebar, placeholder_text="SKU (ej: TVS-2001)")
        self.entry_sku.pack(padx=15, pady=5, fill="x")

        # Compatibilidad
        self.entry_compat = ctk.CTkEntry(self.sidebar, placeholder_text="Compatibilidad (ej: TVS King 200 / Bajaj RE)")
        self.entry_compat.pack(padx=15, pady=5, fill="x")

        # Botón Seleccionar Imagen
        self.btn_img = ctk.CTkButton(
            self.sidebar, 
            text="📷 Seleccionar Foto", 
            fg_color="#3B82F6", 
            hover_color="#2563EB",
            command=self.seleccionar_imagen
        )
        self.btn_img.pack(padx=15, pady=8, fill="x")

        self.lbl_img_path = ctk.CTkLabel(self.sidebar, text="Sin foto seleccionada", text_color="gray", font=ctk.CTkFont(size=11))
        self.lbl_img_path.pack(padx=15, pady=(0, 8))

        # Botones Principales de Formulario: Guardar (más angosto) y Publicar lado a lado
        self.frame_acciones_form = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        self.frame_acciones_form.pack(padx=15, pady=6, fill="x")

        self.btn_guardar = ctk.CTkButton(
            self.frame_acciones_form, 
            text="💾 Guardar", 
            fg_color="#10B981", 
            hover_color="#059669",
            font=ctk.CTkFont(weight="bold"),
            command=self.agregar_o_actualizar_producto
        )
        self.btn_guardar.pack(side="left", padx=(0, 4), fill="x", expand=True)

        self.btn_publicar = ctk.CTkButton(
            self.frame_acciones_form, 
            text="🚀 Publicar Web", 
            fg_color="#F59E0B", 
            hover_color="#D97706",
            text_color="#000000",
            font=ctk.CTkFont(weight="bold"),
            command=self.publicar_git
        )
        self.btn_publicar.pack(side="right", padx=(4, 0), fill="x", expand=True)

        # Botón Cancelar Edición (oculto por defecto)
        self.btn_cancelar = ctk.CTkButton(
            self.sidebar,
            text="✖️ Cancelar Edición",
            fg_color="#6B7280",
            hover_color="#4B5563",
            command=self.cancelar_edicion
        )

        # SECCIÓN REPORTES AUTOMATIZADOS (Excel y PDF)
        frame_reportes = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        frame_reportes.pack(padx=15, pady=(4, 0), fill="x")

        btn_excel = ctk.CTkButton(
            frame_reportes,
            text="📊 Exportar Excel",
            fg_color="#059669",
            hover_color="#047857",
            font=ctk.CTkFont(size=12, weight="bold"),
            command=self.exportar_excel
        )
        btn_excel.pack(side="left", padx=(0, 4), fill="x", expand=True)

        btn_pdf = ctk.CTkButton(
            frame_reportes,
            text="📄 Catálogo PDF",
            fg_color="#DC2626",
            hover_color="#B91C1C",
            font=ctk.CTkFont(size=12, weight="bold"),
            command=self.exportar_pdf
        )
        btn_pdf.pack(side="right", padx=(4, 0), fill="x", expand=True)

        # BOTÓN SECUNDARIO: PÁGINA WEB ESTÁTICA OFFLINE (HTML)
        self.btn_web_estatica = ctk.CTkButton(
            self.sidebar,
            text="🌐 Ver Página Web Estática (HTML)",
            fg_color="#2563EB",
            hover_color="#1D4ED8",
            text_color="#FFFFFF",
            font=ctk.CTkFont(size=12, weight="bold"),
            height=32,
            command=self.publicar_web_estatica
        )
        self.btn_web_estatica.pack(padx=15, pady=(6, 8), fill="x")

    def crear_panel_lista(self):
        """Panel derecho con el catálogo actual"""
        self.panel_right = ctk.CTkFrame(self, corner_radius=15)
        self.panel_right.grid(row=0, column=1, padx=(0, 15), pady=15, sticky="nsew")
        self.panel_right.grid_rowconfigure(1, weight=1)
        self.panel_right.grid_columnconfigure(0, weight=1)

        header_frame = ctk.CTkFrame(self.panel_right, fg_color="transparent")
        header_frame.grid(row=0, column=0, padx=15, pady=15, sticky="ew")

        lbl_cat = ctk.CTkLabel(
            header_frame, 
            text="📦 Catálogo Actual de Repuestos", 
            font=ctk.CTkFont(size=18, weight="bold")
        )
        lbl_cat.pack(side="left")

        self.btn_redo = ctk.CTkButton(
            header_frame,
            text="↪️ Rehacer",
            width=105,
            fg_color="#4B5563",
            hover_color="#374151",
            command=self.rehacer
        )
        self.btn_redo.pack(side="right", padx=(5, 0))

        self.btn_undo = ctk.CTkButton(
            header_frame,
            text="↩️ Deshacer",
            width=105,
            fg_color="#4B5563",
            hover_color="#374151",
            command=self.deshacer
        )
        self.btn_undo.pack(side="right", padx=5)

        # Scrollable Frame para la lista
        self.scroll_list = ctk.CTkScrollableFrame(self.panel_right)
        self.scroll_list.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="nsew")

        self.actualizar_lista_ui()

    def actualizar_lista_ui(self):
        """Dibuja los productos en la lista derecha sin IDs ni SKUs"""
        if hasattr(self, 'btn_undo'):
            undo_count = len(self.history_undo)
            redo_count = len(self.history_redo)
            self.btn_undo.configure(
                text=f"↩️ Deshacer ({undo_count})",
                state="normal" if undo_count > 0 else "disabled",
                fg_color="#3B82F6" if undo_count > 0 else "#4B5563"
            )
            self.btn_redo.configure(
                text=f"↪️ Rehacer ({redo_count})",
                state="normal" if redo_count > 0 else "disabled",
                fg_color="#3B82F6" if redo_count > 0 else "#4B5563"
            )

        for child in self.scroll_list.winfo_children():
            child.destroy()

        if not self.productos:
            lbl_vacio = ctk.CTkLabel(self.scroll_list, text="No hay productos guardados en public/productos.json.", text_color="gray")
            lbl_vacio.pack(pady=20)
            return

        for idx, p in enumerate(self.productos):
            card = ctk.CTkFrame(self.scroll_list, corner_radius=10)
            card.pack(padx=5, pady=5, fill="x", expand=True)

            # Botones a la derecha
            btn_del = ctk.CTkButton(
                card, 
                text="❌ Eliminar", 
                width=80, 
                fg_color="#EF4444", 
                hover_color="#DC2626",
                command=lambda i=idx: self.eliminar_producto(i)
            )
            btn_del.pack(side="right", padx=(5, 15), pady=10)

            btn_edit = ctk.CTkButton(
                card, 
                text="✏️ Editar", 
                width=80, 
                fg_color="#3B82F6", 
                hover_color="#2563EB",
                command=lambda i=idx: self.editar_producto(i)
            )
            btn_edit.pack(side="right", padx=(5, 0), pady=10)

            # Label de información con precios y SKU
            sku = p.get('sku', '') or p.get('skuOEM', '')
            sku_str = f"\nSKU: {sku}" if sku else ""
            p_oem = float(p.get('priceOEM', p.get('priceOriginal', 0)) or 0)
            p_alt = float(p.get('priceAlt', 0) or 0)
            pm_oem = float(p.get('priceMayorOEM', p.get('priceMayorOriginal', 0)) or 0)
            pm_alt = float(p.get('priceMayorAlt', 0) or 0)

            mayor_str = f" | May: S/{pm_oem:.2f}" if pm_oem > 0 else ""
            mayor_alt_str = f" | May: S/{pm_alt:.2f}" if pm_alt > 0 else ""

            lbl_info = ctk.CTkLabel(
                card, 
                text=f"[{p.get('brand', 'TVS')}] {p.get('name', '')}\nOEM (Men: S/{p_oem:.2f}{mayor_str})\nAlt (Men: S/{p_alt:.2f}{mayor_alt_str}){sku_str}",
                font=ctk.CTkFont(size=12, weight="bold"),
                justify="left",
                anchor="w",
                wraplength=340
            )
            lbl_info.pack(side="left", fill="x", expand=True, padx=15, pady=10)

    def editar_producto(self, idx):
        """Carga los datos del producto seleccionado en el formulario para editarlo"""
        if idx < 0 or idx >= len(self.productos):
            return

        p = self.productos[idx]
        self.producto_editando_idx = idx

        # Cambiar aspecto a modo edición
        self.lbl_form_titulo.configure(text="✏️ Editar Repuesto")
        self.btn_guardar.configure(text="💾 Actualizar", fg_color="#3B82F6", hover_color="#2563EB")
        self.btn_cancelar.pack(padx=15, pady=(0, 6), fill="x", after=self.frame_acciones_form)

        # Limpiar y rellenar entradas
        self.entry_nombre.delete(0, "end")
        self.entry_nombre.insert(0, p.get("name", ""))

        self.entry_marca.delete(0, "end")
        self.entry_marca.insert(0, p.get("brand", ""))

        self.entry_cat.delete(0, "end")
        self.entry_cat.insert(0, p.get("category", ""))

        self.entry_costo_original.delete(0, "end")
        self.entry_costo_original.insert(0, str(p.get("costoOriginal", p.get("costo_original", p.get("costoInicial", p.get("costo_inicial", ""))))))

        self.entry_costo_alt.delete(0, "end")
        self.entry_costo_alt.insert(0, str(p.get("costoAlt", p.get("costo_alt", p.get("costoAlternativo", "")))))

        self.entry_precio_oem.delete(0, "end")
        self.entry_precio_oem.insert(0, str(p.get("priceOEM", p.get("priceOriginal", 0))))

        self.entry_precio_alt.delete(0, "end")
        self.entry_precio_alt.insert(0, str(p.get("priceAlt", 0)))

        self.entry_precio_mayor_oem.delete(0, "end")
        self.entry_precio_mayor_oem.insert(0, str(p.get("priceMayorOEM", p.get("priceMayorOriginal", 0))))

        self.entry_precio_mayor_alt.delete(0, "end")
        self.entry_precio_mayor_alt.insert(0, str(p.get("priceMayorAlt", 0)))

        self.entry_stock_oem.delete(0, "end")
        self.entry_stock_oem.insert(0, str(p.get("stockOEM", p.get("stockOriginal", 0))))

        self.entry_stock_alt.delete(0, "end")
        self.entry_stock_alt.insert(0, str(p.get("stockAlt", 0)))

        self.entry_sku.delete(0, "end")
        self.entry_sku.insert(0, p.get("sku", "") or p.get("skuOEM", ""))

        self.entry_compat.delete(0, "end")
        self.entry_compat.insert(0, p.get("modelCompatibility", ""))

        if p.get("imageUrl"):
            self.lbl_img_path.configure(text=os.path.basename(p.get("imageUrl")), text_color="#3B82F6")
        else:
            self.lbl_img_path.configure(text="Sin foto seleccionada", text_color="gray")

    def cancelar_edicion(self):
        """Cancela el modo edición y limpia el formulario"""
        self.producto_editando_idx = None
        self.lbl_form_titulo.configure(text="⚙️ Añadir Repuesto")
        self.btn_guardar.configure(text="💾 Guardar", fg_color="#10B981", hover_color="#059669")
        self.btn_cancelar.pack_forget()

        self.entry_nombre.delete(0, "end")
        self.entry_marca.delete(0, "end")
        self.entry_cat.delete(0, "end")
        self.entry_costo_original.delete(0, "end")
        self.entry_costo_alt.delete(0, "end")
        self.entry_precio_oem.delete(0, "end")
        self.entry_precio_alt.delete(0, "end")
        self.entry_precio_mayor_oem.delete(0, "end")
        self.entry_precio_mayor_alt.delete(0, "end")
        self.entry_stock_oem.delete(0, "end")
        self.entry_stock_alt.delete(0, "end")
        self.entry_sku.delete(0, "end")
        self.entry_compat.delete(0, "end")
        self.temp_image_path = None
        self.lbl_img_path.configure(text="Sin foto seleccionada", text_color="gray")

    def seleccionar_imagen(self):
        filename = filedialog.askopenfilename(
            title="Seleccionar foto del repuesto",
            filetypes=[("Imágenes", "*.jpg *.jpeg *.png *.webp")]
        )
        if filename:
            self.temp_image_path = filename
            self.lbl_img_path.configure(text=os.path.basename(filename), text_color="#10B981")

    def agregar_o_actualizar_producto(self):
        nombre = self.entry_nombre.get().strip()

        if not nombre:
            messagebox.showwarning("Atención", "El Nombre del repuesto es obligatorio.")
            return

        try:
            costo_orig = float(self.entry_costo_original.get() or 0)
            costo_alt = float(self.entry_costo_alt.get() or 0)
            precio_oem = float(self.entry_precio_oem.get() or 0)
            precio_alt = float(self.entry_precio_alt.get() or 0)
            precio_mayor_oem = float(self.entry_precio_mayor_oem.get() or 0)
            precio_mayor_alt = float(self.entry_precio_mayor_alt.get() or 0)
            stock_oem = int(self.entry_stock_oem.get() or 0)
            stock_alt = int(self.entry_stock_alt.get() or 0)
        except ValueError:
            messagebox.showerror("Error", "Los precios, costos y stocks deben ser números válidos.")
            return

        sku = self.entry_sku.get().strip()

        # Determinar imagen
        if self.producto_editando_idx is not None and self.producto_editando_idx < len(self.productos):
            prod_existente = self.productos[self.producto_editando_idx]
            rel_img_url = prod_existente.get("imageUrl", "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600")
        else:
            rel_img_url = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600"

        if self.temp_image_path and os.path.exists(self.temp_image_path):
            ext = os.path.splitext(self.temp_image_path)[1]
            timestamp_id = int(time.time())
            nuevo_nombre_img = f"repuesto_{timestamp_id}{ext}"
            destino_img = os.path.join(self.imagenes_dir, nuevo_nombre_img)
            try:
                shutil.copy(self.temp_image_path, destino_img)
                # Formato relativo para la web
                rel_img_url = f"/imagenes/{nuevo_nombre_img}"
            except Exception as e:
                messagebox.showerror("Error al copiar imagen", str(e))

        nuevo_prod = {
            "name": nombre,
            "brand": self.entry_marca.get().strip() or "TVS",
            "category": self.entry_cat.get().strip() or "Motor",
            "modelCompatibility": self.entry_compat.get().strip() or "TVS / Bajaj",
            "sku": sku,
            "imageUrl": rel_img_url,
            "costoOriginal": costo_orig,
            "costoAlt": costo_alt,
            "priceOriginal": precio_oem,
            "priceOEM": precio_oem,
            "priceAlt": precio_alt,
            "priceMayorOEM": precio_mayor_oem,
            "priceMayorAlt": precio_mayor_alt,
            "stockOriginal": stock_oem,
            "stockOEM": stock_oem,
            "stockAlt": stock_alt
        }

        # Registrar historial antes de modificar
        self.registrar_historial()

        if self.producto_editando_idx is not None and self.producto_editando_idx < len(self.productos):
            # Actualizar existente
            self.productos[self.producto_editando_idx] = nuevo_prod
            msg_exito = "¡Repuesto actualizado exitosamente!"
        else:
            # Agregar nuevo
            self.productos.append(nuevo_prod)
            msg_exito = "¡Repuesto añadido exitosamente al catálogo!"

        if self.guardar_productos():
            messagebox.showinfo("Éxito", msg_exito)
            self.cancelar_edicion()
            self.actualizar_lista_ui()

    def eliminar_producto(self, idx):
        if idx < 0 or idx >= len(self.productos):
            return

        nombre_p = self.productos[idx].get("name", "este repuesto")
        if messagebox.askyesno("Confirmar", f"¿Deseas eliminar '{nombre_p}' del catálogo?"):
            self.registrar_historial()
            del self.productos[idx]
            if self.producto_editando_idx == idx:
                self.cancelar_edicion()
            elif self.producto_editando_idx is not None and self.producto_editando_idx > idx:
                self.producto_editando_idx -= 1

            if self.guardar_productos():
                self.actualizar_lista_ui()

    def publicar_web_estatica(self):
        """
        Publica y genera la versión web estática del catálogo:
        1. Guarda los datos actuales en public/productos.json.
        2. Genera los archivos HTML estáticos autónomos (public/catalogo_web_estatico.html y public/standalone_index.html)
           con los datos incrustados en JavaScript (sin problemas de CORS ni necesidad de servidor).
        3. Opcionalmente ejecuta 'npm run build' si Node.js está disponible para actualizar la carpeta dist/.
        4. Pregunta al usuario si desea abrir la página web inmediatamente en su navegador.
        """
        if not self.guardar_productos():
            return

        datos_reportes = self.obtener_datos_para_reportes()
        if not datos_reportes:
            messagebox.showwarning("Catálogo Vacío", "No hay productos en el catálogo para publicar.")
            return

        try:
            ruta_estatica = os.path.join(self.public_dir, "catalogo_web_estatico.html")
            ruta_standalone = os.path.join(self.public_dir, "standalone_index.html")

            # Generar HTML autónomo con datos incrustados
            if REPORTES_DISPONIBLE:
                generar_pagina_web_estatica(datos_reportes, ruta_salida=ruta_estatica, base_dir=self.script_dir)
                generar_pagina_web_estatica(datos_reportes, ruta_salida=ruta_standalone, base_dir=self.script_dir)
            
            # Intentar compilar con Vite para dist/
            dist_dir = os.path.join(self.script_dir, "dist")
            try:
                subprocess.run("npm run build", cwd=self.script_dir, shell=True, capture_output=True, timeout=25)
                if os.path.isdir(dist_dir) and REPORTES_DISPONIBLE:
                    generar_pagina_web_estatica(datos_reportes, ruta_salida=os.path.join(dist_dir, "catalogo_web_estatico.html"), base_dir=self.script_dir)
            except Exception:
                pass

            msg = (
                f"✅ ¡Página Web Estática Generada con Éxito!\n\n"
                f"📁 Archivo: {ruta_estatica}\n\n"
                f"• Datos de {len(datos_reportes)} repuestos incrustados directamente.\n"
                f"• Funciona sin necesidad de servidor (abrir directamente con doble clic).\n"
                f"• Conectado a WhatsApp para cotizaciones automáticas.\n"
                f"• Listo para subir a GitHub Pages, Netlify, Vercel o cualquier hosting.\n\n"
                f"¿Deseas abrir la página web en tu navegador ahora mismo?"
            )

            if messagebox.askyesno("Web Estática Publicada", msg):
                webbrowser.open(f"file://{os.path.abspath(ruta_estatica)}")

        except Exception as e:
            messagebox.showerror("Error", f"Ocurrió un error al generar la página web estática:\n{str(e)}")

    def publicar_git(self):
        """Ejecuta la secuencia completa de guardado, compilación y sincronización/publicación a GitHub y GitHub Pages"""
        try:
            # 1. Guardar primero el catálogo actual en JSON
            if not self.guardar_productos():
                return

            datos_reportes = self.obtener_datos_para_reportes()
            if not datos_reportes:
                messagebox.showwarning("Catálogo Vacío", "No hay productos en el catálogo para publicar.")
                return

            # 2. Generar páginas estáticas autónomas
            if REPORTES_DISPONIBLE:
                ruta_estatica = os.path.join(self.public_dir, "catalogo_web_estatico.html")
                ruta_standalone = os.path.join(self.public_dir, "standalone_index.html")
                generar_pagina_web_estatica(datos_reportes, ruta_salida=ruta_estatica, base_dir=self.script_dir)
                generar_pagina_web_estatica(datos_reportes, ruta_salida=ruta_standalone, base_dir=self.script_dir)

            # 3. Compilar aplicación con Vite para dist/
            res_build = subprocess.run(
                "npm run build",
                cwd=self.script_dir,
                shell=True,
                capture_output=True,
                text=True
            )
            if res_build.returncode != 0:
                error_msg = res_build.stderr or res_build.stdout or "Error desconocido al compilar"
                print(f"Aviso en build: {error_msg}")

            # 4. git add .
            res_add = subprocess.run(
                ["git", "add", "."],
                cwd=self.script_dir,
                capture_output=True,
                text=True
            )
            if res_add.returncode != 0:
                raise Exception(f"Fallo en 'git add .':\n{res_add.stderr or res_add.stdout}")

            # 5. git commit con fecha y hora
            fecha_str = time.strftime("%d/%m/%Y %H:%M")
            subprocess.run(
                ["git", "commit", "-m", f"Actualización catálogo HW-Andevia ({len(datos_reportes)} repuestos) - {fecha_str}"],
                cwd=self.script_dir,
                capture_output=True,
                text=True
            )

            # 6. git push a repositorio remoto en GitHub
            res_push = subprocess.run(
                ["git", "push"],
                cwd=self.script_dir,
                capture_output=True,
                text=True
            )
            if res_push.returncode != 0:
                # Intentar push especificando origin y rama actual
                subprocess.run(
                    "git push -u origin HEAD",
                    cwd=self.script_dir,
                    shell=True,
                    capture_output=True,
                    text=True
                )

            # 7. Despliegue en vivo a GitHub Pages (si aplica)
            res_deploy = subprocess.run(
                "npm run deploy",
                cwd=self.script_dir,
                shell=True,
                capture_output=True,
                text=True
            )
            if res_deploy.returncode != 0:
                # Fallback con npx gh-pages directo
                subprocess.run(
                    "npx gh-pages -d dist",
                    cwd=self.script_dir,
                    shell=True,
                    capture_output=True,
                    text=True
                )

            messagebox.showinfo(
                "🚀 Sincronización con GitHub Exitosa",
                f"¡Excelente!\n\n"
                f"1. ✅ Se guardaron {len(datos_reportes)} repuestos en public/productos.json.\n"
                f"2. 📦 Se compilaron los archivos estáticos y la carpeta dist/.\n"
                f"3. 🐙 Se realizó el commit y se envió todo a tu repositorio de GitHub (git push).\n"
                f"4. 🌐 Los cambios ya están sincronizados y disponibles en la nube."
            )
        except Exception as e:
            messagebox.showerror(
                "Error al Publicar en Git",
                f"Ocurrió un problema durante la sincronización:\n\n{str(e)}\n\n"
                f"Verifica que tu terminal tenga configuradas las credenciales de GitHub (git remote y acceso)."
            )

    def obtener_datos_para_reportes(self):
        """
        Adapta la lista interna de productos al formato estandarizado para Excel, PDF y Web.
        Reutiliza la normalización unificada de reportes.py.
        """
        if REPORTES_DISPONIBLE:
            return [_normalizar_producto(p) for p in self.productos]

        datos_estandarizados = []
        for p in self.productos:
            costo_orig = float(p.get("costoOriginal", 0) or 0)
            costo_alt = float(p.get("costoAlt", 0) or 0)
            p_oem = float(p.get("priceOriginal", p.get("priceOEM", 0)) or 0)
            pm_oem = float(p.get("priceMayorOEM", p.get("priceMayorOriginal", 0)) or 0)
            cant_oem = int(p.get("stockOriginal", p.get("stockOEM", 0)) or 0)
            p_alt = float(p.get("priceAlt", 0) or 0)
            pm_alt = float(p.get("priceMayorAlt", 0) or 0)
            cant_alt = int(p.get("stockAlt", 0) or 0)

            datos_estandarizados.append({
                "marca": p.get("brand", "TVS"),
                "codigo": p.get("sku", "") or "S/C",
                "descripcion": p.get("name", "Sin descripción"),
                "categoria": p.get("category", "Motor"),
                "compatibilidad": p.get("modelCompatibility", "TVS / Bajaj"),
                "costo_inicial_original": costo_orig,
                "costo_inicial_alt": costo_alt,
                "costo_original": costo_orig,
                "costo_alt": costo_alt,
                "precio_original": p_oem,
                "precio_mayor_original": pm_oem,
                "cantidad_original": cant_oem,
                "precio_alternativo": p_alt,
                "precio_mayor_alternativo": pm_alt,
                "precio_mayor_alt": pm_alt,
                "cantidad_alternativo": cant_alt,
                "ruta_imagen": p.get("imageUrl", "")
            })
        return datos_estandarizados

    def exportar_excel(self):
        """Genera y guarda el reporte en Excel (.xlsx) con openpyxl"""
        if not REPORTES_DISPONIBLE:
            messagebox.showerror("Error", "El módulo 'reportes.py' o la librería 'openpyxl' no están instalados.")
            return

        if not self.productos:
            messagebox.showwarning("Atención", "No hay productos en el catálogo para exportar.")
            return

        ruta_sugerida = os.path.join(self.script_dir, "inventario_productos.xlsx")
        ruta_guardar = filedialog.asksaveasfilename(
            title="Guardar Inventario Excel",
            initialfile="inventario_productos.xlsx",
            defaultextension=".xlsx",
            filetypes=[("Archivos Excel", "*.xlsx")]
        )

        if not ruta_guardar:
            return

        try:
            datos = self.obtener_datos_para_reportes()
            ruta_final = generar_excel_productos(datos, ruta_salida=ruta_guardar)
            messagebox.showinfo(
                "Excel Generado",
                f"✅ Reporte de inventario en 3 hojas generado exitosamente:\n\n{ruta_final}\n\n"
                "• Hoja 1 'Original': Precios de venta, costos originales y Suma Total Original.\n"
                "• Hoja 2 'Alternativo': Precios de venta, costos alternativos y Suma Total Alternativa.\n"
                "• Hoja 3 'Consolidado': Cuadro resumen y Gran Total (Total Original + Total Alternativo).\n\n"
                "- Fórmulas nativas de Excel en todas las hojas\n"
                "- Formato cebra, bordes completos y alineación profesional."
            )
        except Exception as e:
            messagebox.showerror("Error al Generar Excel", f"Ocurrió un error:\n{str(e)}")

    def exportar_pdf(self):
        """Genera y guarda el catálogo en PDF con imágenes, precios al por menor y al por mayor"""
        if not REPORTES_DISPONIBLE:
            messagebox.showerror("Error", "El módulo 'reportes.py' no está disponible.")
            return

        if not self.productos:
            messagebox.showwarning("Atención", "No hay productos en el catálogo para exportar.")
            return

        ruta_guardar = filedialog.asksaveasfilename(
            title="Guardar Catálogo PDF",
            initialfile="catalogo_productos.pdf",
            defaultextension=".pdf",
            filetypes=[("Archivos PDF", "*.pdf"), ("Archivos HTML", "*.html")]
        )

        if not ruta_guardar:
            return

        try:
            datos = self.obtener_datos_para_reportes()
            ruta_final = generar_catalogo_pdf(datos, ruta_salida=ruta_guardar, base_dir=self.script_dir)
            messagebox.showinfo(
                "Catálogo PDF Generado",
                f"✅ Catálogo generado exitosamente:\n\n{ruta_final}\n\n"
                "- Precios al por Menor y al por Mayor diferenciados\n"
                "- Calidad Original y Calidad Alternativa\n"
                "- Imágenes con soporte automático y compatibilidad de mototaxis."
            )
        except Exception as e:
            messagebox.showerror("Error al Generar PDF", f"Ocurrió un error:\n{str(e)}")

if __name__ == "__main__":
    app = HWAndeviaAdminApp()
    app.mainloop()
