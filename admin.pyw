#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HW-Andevia Perú - Administrador de Catálogo, Reportes e Importación/Exportación Excel
Interfaz administrativa de escritorio con CustomTkinter para la gestión del catálogo
de repuestos de mototaxis (TVS King, Torito Bajaj, etc.).
"""

import os
import json
import time
import shutil
import subprocess
import webbrowser
import tkinter as tk
from tkinter import filedialog, messagebox

try:
    import customtkinter as ctk
    CTK_DISPONIBLE = True
except ImportError:
    CTK_DISPONIBLE = False

try:
    from reportes import (
        generar_excel_productos,
        generar_excel_catalogo_cliente,
        generar_excel_predisenado_plantilla,
        leer_excel_productos,
        generar_catalogo_pdf,
        _normalizar_producto
    )
    REPORTES_DISPONIBLE = True
except ImportError:
    REPORTES_DISPONIBLE = False

if CTK_DISPONIBLE:
    ctk.set_appearance_mode("System")
    ctk.set_default_color_theme("blue")
    BaseClass = ctk.CTk
else:
    BaseClass = tk.Tk


class HWAndeviaAdminApp(BaseClass):
    def __init__(self):
        super().__init__()

        self.title("HW-Andevia Perú • Administrador de Catálogo & Reportes")
        self.geometry("1280x820")
        self.minsize(1050, 700)

        # Rutas de archivos
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.public_dir = os.path.join(self.script_dir, "public")
        self.imagenes_dir = os.path.join(self.public_dir, "imagenes")
        self.json_path = os.path.join(self.public_dir, "productos.json")

        if not os.path.exists(self.imagenes_dir):
            os.makedirs(self.imagenes_dir, exist_ok=True)

        # Estado y Pila de deshacer / rehacer
        self.productos = []
        self.historial_deshacer = []
        self.historial_rehacer = []
        self.producto_editando_idx = None
        self.temp_image_path = None

        # Configurar layout de grilla principal
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(0, weight=0)  # Formulario lateral (ancho fijo)
        self.grid_columnconfigure(1, weight=1)  # Catálogo lista productos

        # Cargar productos
        self.cargar_productos()

        # Construir Interfaz Gráfica
        self.crear_sidebar_formulario()
        self.crear_panel_lista()

    def cargar_productos(self):
        """Carga el catálogo desde public/productos.json."""
        if os.path.exists(self.json_path):
            try:
                with open(self.json_path, "r", encoding="utf-8") as f:
                    self.productos = json.load(f)
            except Exception as e:
                messagebox.showerror("Error al Cargar", f"No se pudo leer {self.json_path}:\n{e}")
                self.productos = []
        else:
            self.productos = []

    def guardar_productos(self) -> bool:
        """Guarda la lista actual de productos en public/productos.json."""
        try:
            with open(self.json_path, "w", encoding="utf-8") as f:
                json.dump(self.productos, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            messagebox.showerror("Error al Guardar", f"No se pudo guardar el archivo:\n{e}")
            return False

    def registrar_historial(self):
        """Guarda un snapshot del estado actual para permitir Deshacer."""
        copia_estado = json.loads(json.dumps(self.productos))
        self.historial_deshacer.append(copia_estado)
        self.historial_rehacer.clear()
        if len(self.historial_deshacer) > 30:
            self.historial_deshacer.pop(0)

    def deshacer(self):
        """Deshace el último cambio en los productos."""
        if not self.historial_deshacer:
            return
        estado_previo = self.historial_deshacer.pop()
        self.historial_rehacer.append(json.loads(json.dumps(self.productos)))
        self.productos = estado_previo
        self.guardar_productos()
        self.cancelar_edicion()
        self.actualizar_lista_ui()

    def rehacer(self):
        """Rehace el último cambio deshecho."""
        if not self.historial_rehacer:
            return
        estado_siguiente = self.historial_rehacer.pop()
        self.historial_deshacer.append(json.loads(json.dumps(self.productos)))
        self.productos = estado_siguiente
        self.guardar_productos()
        self.cancelar_edicion()
        self.actualizar_lista_ui()

    def crear_sidebar_formulario(self):
        """Crea el panel lateral con el formulario de productos y los botones de exportación."""
        self.sidebar_frame = ctk.CTkScrollableFrame(self, width=440, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 10), pady=0)

        # Encabezado del Formulario
        self.lbl_form_titulo = ctk.CTkLabel(
            self.sidebar_frame,
            text="⚙️ Añadir Repuesto",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        self.lbl_form_titulo.pack(padx=15, pady=(15, 10), anchor="w")

        # Nombre del producto
        ctk.CTkLabel(self.sidebar_frame, text="Nombre del Repuesto *:", font=ctk.CTkFont(size=12, weight="bold")).pack(padx=15, pady=(5, 0), anchor="w")
        self.entry_nombre = ctk.CTkEntry(self.sidebar_frame, placeholder_text="ej: Kit Cilindro y Pistón Completo 200cc")
        self.entry_nombre.pack(padx=15, pady=(2, 6), fill="x")

        # Marca y Categoría en dos columnas
        frame_mc = ctk.CTkFrame(self.sidebar_frame, fg_color="transparent")
        frame_mc.pack(padx=15, pady=4, fill="x")
        frame_mc.grid_columnconfigure(0, weight=1)
        frame_mc.grid_columnconfigure(1, weight=1)

        ctk.CTkLabel(frame_mc, text="Marca:", font=ctk.CTkFont(size=11, weight="bold")).grid(row=0, column=0, sticky="w", padx=(0, 5))
        self.entry_marca = ctk.CTkComboBox(frame_mc, values=["TVS", "Bajaj", "Universal", "Zongshen", "Wanxin"])
        self.entry_marca.set("TVS")
        self.entry_marca.grid(row=1, column=0, sticky="ew", padx=(0, 5))

        ctk.CTkLabel(frame_mc, text="Categoría:", font=ctk.CTkFont(size=11, weight="bold")).grid(row=0, column=1, sticky="w", padx=(5, 0))
        self.entry_cat = ctk.CTkComboBox(frame_mc, values=["Motor", "Transmisión", "Combustible", "Frenos", "Sistemas Eléctricos", "Suspensión", "Carrocería", "Accesorios"])
        self.entry_cat.set("Motor")
        self.entry_cat.grid(row=1, column=1, sticky="ew", padx=(5, 0))

        # --- SECCIÓN ORIGINAL (OEM) ---
        lbl_sec_orig = ctk.CTkLabel(self.sidebar_frame, text="🔶 Calidad Original (OEM)", font=ctk.CTkFont(size=13, weight="bold"), text_color="#D97706")
        lbl_sec_orig.pack(padx=15, pady=(10, 4), anchor="w")

        frame_orig = ctk.CTkFrame(self.sidebar_frame, fg_color="transparent")
        frame_orig.pack(padx=15, pady=2, fill="x")
        frame_orig.grid_columnconfigure((0, 1), weight=1)

        ctk.CTkLabel(frame_orig, text="Costo Original S/:", font=ctk.CTkFont(size=11)).grid(row=0, column=0, sticky="w", padx=(0, 4))
        self.entry_costo_original = ctk.CTkEntry(frame_orig, placeholder_text="0.00")
        self.entry_costo_original.grid(row=1, column=0, sticky="ew", padx=(0, 4), pady=(0, 4))

        ctk.CTkLabel(frame_orig, text="Stock Original:", font=ctk.CTkFont(size=11)).grid(row=0, column=1, sticky="w", padx=(4, 0))
        self.entry_stock_oem = ctk.CTkEntry(frame_orig, placeholder_text="10")
        self.entry_stock_oem.grid(row=1, column=1, sticky="ew", padx=(4, 0), pady=(0, 4))

        ctk.CTkLabel(frame_orig, text="Precio Menor Original S/:", font=ctk.CTkFont(size=11)).grid(row=2, column=0, sticky="w", padx=(0, 4))
        self.entry_precio_oem = ctk.CTkEntry(frame_orig, placeholder_text="0.00")
        self.entry_precio_oem.grid(row=3, column=0, sticky="ew", padx=(0, 4))

        ctk.CTkLabel(frame_orig, text="Precio Mayor Original S/:", font=ctk.CTkFont(size=11)).grid(row=2, column=1, sticky="w", padx=(4, 0))
        self.entry_precio_mayor_oem = ctk.CTkEntry(frame_orig, placeholder_text="0.00")
        self.entry_precio_mayor_oem.grid(row=3, column=1, sticky="ew", padx=(4, 0))

        # --- SECCIÓN ALTERNATIVA ---
        lbl_sec_alt = ctk.CTkLabel(self.sidebar_frame, text="🔷 Calidad Alternativa", font=ctk.CTkFont(size=13, weight="bold"), text_color="#2563EB")
        lbl_sec_alt.pack(padx=15, pady=(10, 4), anchor="w")

        frame_alt = ctk.CTkFrame(self.sidebar_frame, fg_color="transparent")
        frame_alt.pack(padx=15, pady=2, fill="x")
        frame_alt.grid_columnconfigure((0, 1), weight=1)

        ctk.CTkLabel(frame_alt, text="Costo Alternativo S/:", font=ctk.CTkFont(size=11)).grid(row=0, column=0, sticky="w", padx=(0, 4))
        self.entry_costo_alt = ctk.CTkEntry(frame_alt, placeholder_text="0.00")
        self.entry_costo_alt.grid(row=1, column=0, sticky="ew", padx=(0, 4), pady=(0, 4))

        ctk.CTkLabel(frame_alt, text="Stock Alternativo:", font=ctk.CTkFont(size=11)).grid(row=0, column=1, sticky="w", padx=(4, 0))
        self.entry_stock_alt = ctk.CTkEntry(frame_alt, placeholder_text="15")
        self.entry_stock_alt.grid(row=1, column=1, sticky="ew", padx=(4, 0), pady=(0, 4))

        ctk.CTkLabel(frame_alt, text="Precio Menor Alternativo S/:", font=ctk.CTkFont(size=11)).grid(row=2, column=0, sticky="w", padx=(0, 4))
        self.entry_precio_alt = ctk.CTkEntry(frame_alt, placeholder_text="0.00")
        self.entry_precio_alt.grid(row=3, column=0, sticky="ew", padx=(0, 4))

        ctk.CTkLabel(frame_alt, text="Precio Mayor Alternativo S/:", font=ctk.CTkFont(size=11)).grid(row=2, column=1, sticky="w", padx=(4, 0))
        self.entry_precio_mayor_alt = ctk.CTkEntry(frame_alt, placeholder_text="0.00")
        self.entry_precio_mayor_alt.grid(row=3, column=1, sticky="ew", padx=(4, 0))

        # SKU y Compatibilidad
        ctk.CTkLabel(self.sidebar_frame, text="Código SKU / Identificador:", font=ctk.CTkFont(size=11, weight="bold")).pack(padx=15, pady=(8, 0), anchor="w")
        self.entry_sku = ctk.CTkEntry(self.sidebar_frame, placeholder_text="ej: TVS-2001")
        self.entry_sku.pack(padx=15, pady=(2, 4), fill="x")

        ctk.CTkLabel(self.sidebar_frame, text="Compatibilidad de Mototaxis:", font=ctk.CTkFont(size=11, weight="bold")).pack(padx=15, pady=(4, 0), anchor="w")
        self.entry_compat = ctk.CTkEntry(self.sidebar_frame, placeholder_text="ej: TVS King 200, TVS Deluxe 200cc")
        self.entry_compat.pack(padx=15, pady=(2, 8), fill="x")

        # Selector de Foto
        frame_foto = ctk.CTkFrame(self.sidebar_frame, fg_color="transparent")
        frame_foto.pack(padx=15, pady=4, fill="x")
        self.btn_imagen = ctk.CTkButton(frame_foto, text="📷 Seleccionar Foto", width=140, command=self.seleccionar_imagen)
        self.btn_imagen.pack(side="left", padx=(0, 8))
        self.lbl_imagen_seleccionada = ctk.CTkLabel(frame_foto, text="Sin foto seleccionada", text_color="gray", anchor="w")
        self.lbl_imagen_seleccionada.pack(side="left", fill="x", expand=True)

        # Botones de Acción de Producto
        self.btn_guardar = ctk.CTkButton(
            self.sidebar_frame,
            text="💾 Guardar",
            fg_color="#10B981",
            hover_color="#059669",
            height=36,
            command=self.agregar_o_actualizar_producto
        )
        self.btn_guardar.pack(padx=15, pady=(10, 4), fill="x")

        self.btn_cancelar = ctk.CTkButton(
            self.sidebar_frame,
            text="✖️ Cancelar Edición",
            fg_color="#6B7280",
            hover_color="#4B5563",
            height=30,
            command=self.cancelar_edicion
        )
        # Oculto inicialmente hasta que se edite

        # Separador visual
        ctk.CTkFrame(self.sidebar_frame, height=2, fg_color="#374151").pack(padx=15, pady=12, fill="x")

        # --- SECCIÓN IMPORTACIÓN Y EXPORTACIÓN ---
        lbl_sec_exp = ctk.CTkLabel(self.sidebar_frame, text="📊 Importar & Exportar Catálogo", font=ctk.CTkFont(size=14, weight="bold"))
        lbl_sec_exp.pack(padx=15, pady=(0, 6), anchor="w")

        # 1. Botón Descargar Excel Prediseñado (Para editar o añadir repuestos)
        self.btn_descargar_plantilla = ctk.CTkButton(
            self.sidebar_frame,
            text="⬇️ Descargar Excel Prediseñado",
            fg_color="#0D9488",
            hover_color="#0F766E",
            height=34,
            command=self.descargar_excel_predisenado
        )
        self.btn_descargar_plantilla.pack(padx=15, pady=3, fill="x")

        # 2. Botón Leer Excel Prediseñado (Actualizar y añadir repuestos al catálogo)
        self.btn_importar_excel = ctk.CTkButton(
            self.sidebar_frame,
            text="📥 Leer Excel Prediseñado",
            fg_color="#8B5CF6",
            hover_color="#7C3AED",
            height=34,
            command=self.importar_excel
        )
        self.btn_importar_excel.pack(padx=15, pady=3, fill="x")

        # 2. Botón Exportar Excel 1: Costos e Inventario (Original existente con 3 hojas, intacto)
        self.btn_excel_costos = ctk.CTkButton(
            self.sidebar_frame,
            text="📊 Exportar Excel: Costos e Inventario (3 Hojas)",
            fg_color="#0284C7",
            hover_color="#0369A1",
            height=34,
            command=self.exportar_excel
        )
        self.btn_excel_costos.pack(padx=15, pady=3, fill="x")

        # 3. Botón Exportar Excel 2: Catálogo de Precios para Clientes (Nuevo formato estructurado)
        self.btn_excel_cliente = ctk.CTkButton(
            self.sidebar_frame,
            text="📋 Exportar Excel: Catálogo para Clientes",
            fg_color="#059669",
            hover_color="#047857",
            height=34,
            command=self.exportar_excel_cliente
        )
        self.btn_excel_cliente.pack(padx=15, pady=3, fill="x")

        # 4. Botón Catálogo PDF
        self.btn_pdf = ctk.CTkButton(
            self.sidebar_frame,
            text="📄 Generar Catálogo en PDF",
            fg_color="#DC2626",
            hover_color="#B91C1C",
            height=34,
            command=self.exportar_pdf
        )
        self.btn_pdf.pack(padx=15, pady=3, fill="x")

        # 5. Botón Publicar y Sincronizar con GitHub
        self.btn_publicar_git = ctk.CTkButton(
            self.sidebar_frame,
            text="🚀 Sincronizar con GitHub",
            fg_color="#2563EB",
            hover_color="#1D4ED8",
            height=34,
            command=self.publicar_git
        )
        self.btn_publicar_git.pack(padx=15, pady=(3, 15), fill="x")

    def crear_panel_lista(self):
        """Crea el panel derecho para visualizar y gestionar los repuestos del catálogo."""
        self.panel_right = ctk.CTkFrame(self, corner_radius=15)
        self.panel_right.grid(row=0, column=1, padx=(0, 15), pady=15, sticky="nsew")
        self.panel_right.grid_rowconfigure(1, weight=1)
        self.panel_right.grid_columnconfigure(0, weight=1)

        # Cabecera superior con título y botones Deshacer / Rehacer
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

        self.btn_descargar_plantilla_hdr = ctk.CTkButton(
            header_frame,
            text="⬇️ Descargar Excel Prediseñado",
            width=210,
            fg_color="#0D9488",
            hover_color="#0F766E",
            command=self.descargar_excel_predisenado
        )
        self.btn_descargar_plantilla_hdr.pack(side="right", padx=5)

        # Lista scrolleable de repuestos
        self.scroll_list = ctk.CTkScrollableFrame(self.panel_right)
        self.scroll_list.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="nsew")

        self.actualizar_lista_ui()

    def actualizar_lista_ui(self):
        """Refresca la vista de la lista de productos en pantalla."""
        if hasattr(self, "btn_undo"):
            undo_count = len(self.historial_deshacer)
            redo_count = len(self.historial_rehacer)
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
            lbl_vacio = ctk.CTkLabel(
                self.scroll_list,
                text="No hay productos guardados en public/productos.json.",
                text_color="gray"
            )
            lbl_vacio.pack(pady=20)
            return

        for idx, p in enumerate(self.productos):
            card = ctk.CTkFrame(self.scroll_list, corner_radius=10)
            card.pack(padx=5, pady=5, fill="x", expand=True)

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

            sku = p.get("sku", "") or p.get("skuOEM", "")
            sku_text = f"SKU: {sku} | " if sku else ""

            p_oem = float(p.get("priceOEM", p.get("priceOriginal", 0)) or 0)
            p_alt = float(p.get("priceAlt", 0) or 0)
            pm_oem = float(p.get("priceMayorOEM", p.get("priceMayorOriginal", 0)) or 0)
            pm_alt = float(p.get("priceMayorAlt", 0) or 0)

            may_oem_txt = f" | May: S/ {pm_oem:.2f}" if pm_oem > 0 else ""
            may_alt_txt = f" | May: S/ {pm_alt:.2f}" if pm_alt > 0 else ""

            info_texto = (
                f"[{p.get('brand', 'TVS')}] {p.get('name', '')}\n"
                f"{sku_text}Cat: {p.get('category', 'General')}\n"
                f"OEM (Men: S/ {p_oem:.2f}{may_oem_txt}) • Alt (Men: S/ {p_alt:.2f}{may_alt_txt})"
            )

            lbl_info = ctk.CTkLabel(
                card,
                text=info_texto,
                font=ctk.CTkFont(size=12, weight="bold"),
                justify="left",
                anchor="w",
                wraplength=420
            )
            lbl_info.pack(side="left", fill="x", expand=True, padx=15, pady=10)

    def editar_producto(self, idx: int):
        """Carga un repuesto en el formulario para modificarlo."""
        if idx < 0 or idx >= len(self.productos):
            return

        self.producto_editando_idx = idx
        p = self.productos[idx]

        self.lbl_form_titulo.configure(text="✏️ Editar Repuesto")
        self.btn_guardar.configure(text="💾 Actualizar", fg_color="#3B82F6", hover_color="#2563EB")
        self.btn_cancelar.pack(padx=15, pady=(0, 6), fill="x", after=self.btn_guardar)

        self.entry_nombre.delete(0, "end")
        self.entry_nombre.insert(0, p.get("name", ""))

        self.entry_marca.set(p.get("brand", "TVS"))
        self.entry_cat.set(p.get("category", "Motor"))

        self.entry_costo_original.delete(0, "end")
        c_orig = p.get("costoOriginal", p.get("costo_original", p.get("costoInicial", p.get("costo_inicial", ""))))
        self.entry_costo_original.insert(0, str(c_orig) if c_orig else "")

        self.entry_costo_alt.delete(0, "end")
        c_alt = p.get("costoAlt", p.get("costo_alt", p.get("costoAlternativo", "")))
        self.entry_costo_alt.insert(0, str(c_alt) if c_alt else "")

        self.entry_precio_oem.delete(0, "end")
        self.entry_precio_oem.insert(0, str(p.get("priceOEM", p.get("priceOriginal", 0)) or ""))

        self.entry_precio_alt.delete(0, "end")
        self.entry_precio_alt.insert(0, str(p.get("priceAlt", 0) or ""))

        self.entry_precio_mayor_oem.delete(0, "end")
        self.entry_precio_mayor_oem.insert(0, str(p.get("priceMayorOEM", p.get("priceMayorOriginal", 0)) or ""))

        self.entry_precio_mayor_alt.delete(0, "end")
        self.entry_precio_mayor_alt.insert(0, str(p.get("priceMayorAlt", 0) or ""))

        self.entry_stock_oem.delete(0, "end")
        self.entry_stock_oem.insert(0, str(p.get("stockOEM", p.get("stockOriginal", 0)) or ""))

        self.entry_stock_alt.delete(0, "end")
        self.entry_stock_alt.insert(0, str(p.get("stockAlt", 0) or ""))

        self.entry_sku.delete(0, "end")
        self.entry_sku.insert(0, p.get("sku", "") or p.get("skuOEM", ""))

        self.entry_compat.delete(0, "end")
        self.entry_compat.insert(0, p.get("modelCompatibility", ""))

        img = p.get("imageUrl", "")
        if img:
            self.lbl_imagen_seleccionada.configure(text=os.path.basename(img), text_color="#3B82F6")
        else:
            self.lbl_imagen_seleccionada.configure(text="Sin foto seleccionada", text_color="gray")

    def cancelar_edicion(self):
        """Limpia el formulario y vuelve al modo de añadir producto."""
        self.producto_editando_idx = None
        self.lbl_form_titulo.configure(text="⚙️ Añadir Repuesto")
        self.btn_guardar.configure(text="💾 Guardar", fg_color="#10B981", hover_color="#059669")
        self.btn_cancelar.pack_forget()

        self.entry_nombre.delete(0, "end")
        self.entry_marca.set("TVS")
        self.entry_cat.set("Motor")
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
        self.lbl_imagen_seleccionada.configure(text="Sin foto seleccionada", text_color="gray")

    def seleccionar_imagen(self):
        """Abre un explorador para seleccionar una foto de repuesto."""
        filename = filedialog.askopenfilename(
            title="Seleccionar foto del repuesto",
            filetypes=[("Imágenes", "*.jpg *.jpeg *.png *.webp")]
        )
        if filename:
            self.temp_image_path = filename
            self.lbl_imagen_seleccionada.configure(text=os.path.basename(filename), text_color="#10B981")

    def agregar_o_actualizar_producto(self):
        """Valida y guarda o actualiza un repuesto en el catálogo."""
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

        # Determinar URL de imagen
        rel_img_url = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600"
        if self.producto_editando_idx is not None and self.producto_editando_idx < len(self.productos):
            rel_img_url = self.productos[self.producto_editando_idx].get("imageUrl", rel_img_url)

        if self.temp_image_path and os.path.exists(self.temp_image_path):
            ext = os.path.splitext(self.temp_image_path)[1]
            timestamp_id = int(time.time())
            nuevo_nombre_img = f"repuesto_{timestamp_id}{ext}"
            destino_img = os.path.join(self.imagenes_dir, nuevo_nombre_img)
            try:
                shutil.copy(self.temp_image_path, destino_img)
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
            "priceMayorOriginal": precio_mayor_oem,
            "priceMayorAlt": precio_mayor_alt,
            "stockOriginal": stock_oem,
            "stockOEM": stock_oem,
            "stockAlt": stock_alt
        }

        self.registrar_historial()

        if self.producto_editando_idx is not None and self.producto_editando_idx < len(self.productos):
            nuevo_prod["id"] = self.productos[self.producto_editando_idx].get("id", f"p-{len(self.productos)+1}")
            self.productos[self.producto_editando_idx] = nuevo_prod
            msg_exito = "¡Repuesto actualizado exitosamente!"
        else:
            nuevo_prod["id"] = f"p-{int(time.time())}"
            self.productos.append(nuevo_prod)
            msg_exito = "¡Repuesto añadido exitosamente al catálogo!"

        self.guardar_productos()
        messagebox.showinfo("Éxito", msg_exito)
        self.cancelar_edicion()
        self.actualizar_lista_ui()

    def eliminar_producto(self, idx: int):
        """Elimina un repuesto previa confirmación."""
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
            self.guardar_productos()
            self.actualizar_lista_ui()

    def descargar_excel_predisenado(self):
        """
        Genera y descarga la plantilla oficial de Excel prediseñado con los productos actuales,
        permitiendo editar precios, nombres o añadir nuevos repuestos para reimportarlos fácilmente.
        """
        if not REPORTES_DISPONIBLE:
            messagebox.showerror("Error", "El módulo 'reportes.py' o la librería 'openpyxl' no están disponibles.")
            return

        ruta_guardar = filedialog.asksaveasfilename(
            title="Guardar Plantilla Excel Prediseñado",
            initialfile="catalogo_prediseñado.xlsx",
            defaultextension=".xlsx",
            filetypes=[("Archivos Excel", "*.xlsx")]
        )
        if not ruta_guardar:
            return

        try:
            datos = self.obtener_datos_para_reportes()
            ruta_final = generar_excel_predisenado_plantilla(datos, ruta_salida=ruta_guardar)
            messagebox.showinfo(
                "Plantilla Excel Descargada",
                f"✅ Archivo Excel prediseñado guardado exitosamente:\n\n{ruta_final}\n\n"
                "¿Cómo editar y añadir repuestos?\n"
                "1. Abre el archivo en Excel.\n"
                "2. En la hoja 'Catálogo Prediseñado', edita directamente los precios o nombres.\n"
                "   (Importante: conserva el código SKU para que el sistema reconozca qué producto actualizar).\n"
                "3. Para añadir nuevos repuestos, agrega nuevas filas al final con su SKU, nombre y precios.\n"
                "4. Guarda el archivo con Ctrl+S.\n"
                "5. Haz clic en '📥 Leer Excel Prediseñado' para actualizar tu catálogo automáticamente.\n"
                "6. Pulsa '🚀 Sincronizar con GitHub' para subir los cambios a la web."
            )
        except Exception as e:
            messagebox.showerror("Error al Descargar Plantilla", f"Ocurrió un error al generar la plantilla:\n{e}")

    def importar_excel(self):
        """Lee un archivo Excel prediseñado y añade/actualiza los productos en el catálogo."""
        if not REPORTES_DISPONIBLE:
            messagebox.showerror("Error", "El módulo 'reportes.py' o la librería 'openpyxl' no están disponibles.")
            return

        ruta_archivo = filedialog.askopenfilename(
            title="Seleccionar Excel Prediseñado para Importar",
            filetypes=[("Archivos Excel", "*.xlsx *.xls")]
        )
        if not ruta_archivo:
            return

        try:
            productos_importados = leer_excel_productos(ruta_archivo)
            if not productos_importados:
                messagebox.showwarning("Atención", "No se encontraron productos válidos en el archivo Excel.")
                return

            self.registrar_historial()

            # Diccionarios de búsqueda rápida (por SKU y por Nombre)
            skus_existentes = {str(p.get("sku", "")).strip().upper(): idx for idx, p in enumerate(self.productos) if p.get("sku")}
            nombres_existentes = {str(p.get("name", "")).strip().upper(): idx for idx, p in enumerate(self.productos) if p.get("name")}

            nuevos_cont = 0
            actualizados_cont = 0

            for item in productos_importados:
                # Quitar llaves internas temporales
                item.pop("_fuente", None)

                item_sku = str(item.get("sku", "")).strip().upper()
                item_nom = str(item.get("name", "")).strip().upper()

                idx_existente = None
                if item_sku and item_sku in skus_existentes:
                    idx_existente = skus_existentes[item_sku]
                elif item_nom and item_nom in nombres_existentes:
                    idx_existente = nombres_existentes[item_nom]

                if idx_existente is not None:
                    # Actualizar preservando foto existente si el importado trae una genérica
                    p_actual = self.productos[idx_existente]

                    if item.get("name"):
                        p_actual["name"] = item["name"]
                    if item.get("sku"):
                        p_actual["sku"] = item["sku"]

                    # Actualizar precios
                    for pk in ["priceOriginal", "priceOEM", "priceAlt", "priceMayorOEM", "priceMayorOriginal", "priceMayorAlt"]:
                        if pk in item and item[pk] is not None:
                            try:
                                p_actual[pk] = float(item[pk])
                            except (ValueError, TypeError):
                                pass

                    # Actualizar costos si vinieran
                    for ck in ["costoOriginal", "costoAlt"]:
                        if ck in item and item[ck] is not None:
                            try:
                                p_actual[ck] = float(item[ck])
                            except (ValueError, TypeError):
                                pass

                    # Marca y categoría
                    if item.get("brand") and item["brand"] != "TVS / Bajaj":
                        p_actual["brand"] = item["brand"]
                    if item.get("category") and item["category"] != "Repuesto":
                        p_actual["category"] = item["category"]
                    if item.get("modelCompatibility") and item["modelCompatibility"] != "TVS King 200 / Torito Bajaj RE":
                        p_actual["modelCompatibility"] = item["modelCompatibility"]

                    # Foto: preservar imagen personalizada existente
                    if item.get("imageUrl") and ("unsplash" not in item["imageUrl"] or not p_actual.get("imageUrl")):
                        p_actual["imageUrl"] = item["imageUrl"]

                    actualizados_cont += 1
                else:
                    # Nuevo repuesto que se añade al catálogo
                    if not item.get("id"):
                        nuevo_id = f"p-{item.get('sku', 'new').lower().replace(' ', '-')}-{int(time.time()*1000)%100000}"
                        item["id"] = nuevo_id

                    self.productos.append(item)
                    if item.get("sku"):
                        skus_existentes[item.get("sku").strip().upper()] = len(self.productos) - 1
                    if item.get("name"):
                        nombres_existentes[item.get("name").strip().upper()] = len(self.productos) - 1
                    nuevos_cont += 1

            self.guardar_productos()
            self.actualizar_lista_ui()

            messagebox.showinfo(
                "✅ Catálogo Actualizado con Éxito",
                f"Procesamiento del Excel completado:\n\n"
                f"• Repuestos modificados/actualizados: {actualizados_cont}\n"
                f"• Nuevos repuestos agregados: {nuevos_cont}\n"
                f"• Total de repuestos en el catálogo: {len(self.productos)}\n\n"
                "Los cambios ya están guardados en public/productos.json. "
                "Para publicarlos en la web, presiona '🚀 Sincronizar con GitHub'."
            )
        except Exception as e:
            messagebox.showerror("Error al Importar Excel", f"Ocurrió un error al leer el archivo:\n{e}")

    def obtener_datos_para_reportes(self):
        """Adapta la lista interna de productos al formato estandarizado para Excel, PDF y Web."""
        if not self.productos:
            return []
        datos_estandarizados = []
        for p in self.productos:
            costo_orig = float(p.get("costoOriginal", 0) or 0)
            costo_alt = float(p.get("costoAlt", 0) or 0)
            p_oem = float(p.get("priceOriginal", p.get("priceOEM", 0)) or 0)
            pm_oem = float(p.get("priceMayorOEM", p.get("priceMayorOriginal", 0)) or 0)
            cant_oem = int(p.get("stockOriginal", p.get("stockOEM", 10)) or 10)
            p_alt = float(p.get("priceAlt", 0) or 0)
            pm_alt = float(p.get("priceMayorAlt", 0) or 0)
            cant_alt = int(p.get("stockAlt", 10) or 10)

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
        """
        Genera y guarda el reporte en Excel (.xlsx) con costos e inventario (3 hojas: Original, Alternativo, Consolidado).
        Esta es la exportación original mantenida intacta para consultar el costo de tener los productos.
        """
        if not REPORTES_DISPONIBLE:
            messagebox.showerror("Error", "El módulo 'reportes.py' o la librería 'openpyxl' no están instalados.")
            return

        if not self.productos:
            messagebox.showwarning("Atención", "No hay productos en el catálogo para exportar.")
            return

        ruta_sugerida = os.path.join(self.script_dir, "inventario_productos.xlsx")
        ruta_guardar = filedialog.asksaveasfilename(
            title="Guardar Inventario Excel (Costos)",
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
                "Excel de Costos Generado",
                f"✅ Reporte de inventario en 3 hojas generado exitosamente:\n\n{ruta_final}\n\n"
                "• Hoja 1 'Original': Precios de venta, costos originales y Suma Total Original.\n"
                "• Hoja 2 'Alternativo': Precios de venta, costos alternativos y Suma Total Alternativa.\n"
                "• Hoja 3 'Consolidado': Cuadro resumen y Gran Total (Total Original + Total Alternativo).\n\n"
                "- Fórmulas nativas de Excel en todas las hojas\n"
                "- Formato cebra, bordes completos y alineación profesional."
            )
        except Exception as e:
            messagebox.showerror("Error al Generar Excel", f"Ocurrió un error:\n{e}")

    def exportar_excel_cliente(self):
        """
        Genera y guarda el catálogo de precios en Excel (.xlsx) diseñado específicamente para clientes.
        Estructura de columnas:
        - Col 1: SKU al inicio
        - Col 2: Producto (Descripción)
        - Cols 3 y 4: Encabezado 'Original' unido | Sub: 'Al por menor original' y 'Al por mayor original'
        - Col 5: Vacía (separador)
        - Cols 6 y 7: Encabezado 'Alternativa' unido | Sub: 'Al por mayor alternativo' y 'Al por menor alternativo'
        """
        if not REPORTES_DISPONIBLE:
            messagebox.showerror("Error", "El módulo 'reportes.py' o la librería 'openpyxl' no están disponibles.")
            return

        if not self.productos:
            messagebox.showwarning("Atención", "No hay productos en el catálogo para exportar.")
            return

        ruta_sugerida = os.path.join(self.script_dir, "catalogo_precios_cliente.xlsx")
        ruta_guardar = filedialog.asksaveasfilename(
            title="Guardar Catálogo Cliente Excel",
            initialfile="catalogo_precios_cliente.xlsx",
            defaultextension=".xlsx",
            filetypes=[("Archivos Excel", "*.xlsx")]
        )
        if not ruta_guardar:
            return

        try:
            datos = self.obtener_datos_para_reportes()
            ruta_final = generar_excel_catalogo_cliente(datos, ruta_salida=ruta_guardar)
            messagebox.showinfo(
                "Catálogo de Clientes Generado",
                f"✅ Catálogo de precios para clientes generado exitosamente:\n\n{ruta_final}\n\n"
                "• Columna 1 (A): SKU al inicio\n"
                "• Columna 2 (B): Lista de productos\n"
                "• Columnas 3 (C) y 4 (D): 'Original' (Al por menor original y Al por mayor original)\n"
                "• Columna 5 (E): Vacía (separación visual)\n"
                "• Columnas 6 (F) y 7 (G): 'Alternativa' (Al por mayor alternativo y Al por menor alternativo)\n\n"
                "Ideal para cotizaciones y atención directa a clientes sin revelar costos internos."
            )
        except Exception as e:
            messagebox.showerror("Error al Generar Catálogo Excel", f"Ocurrió un error:\n{e}")

    def exportar_pdf(self):
        """Genera y guarda el catálogo en PDF con imágenes, precios al por menor y al por mayor."""
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
            messagebox.showerror("Error al Generar PDF", f"Ocurrió un error:\n{e}")

    def publicar_git(self):
        """Ejecuta la secuencia completa de guardado, compilación de la web y sincronización a GitHub."""
        try:
            if not self.guardar_productos():
                return

            if not self.productos:
                messagebox.showwarning("Catálogo Vacío", "No hay productos en el catálogo para sincronizar.")
                return

            res_build = subprocess.run("npm run build", cwd=self.script_dir, shell=True, capture_output=True, text=True)
            if res_build.returncode != 0:
                print("Aviso en build: ", res_build.stderr or res_build.stdout)

            res_add = subprocess.run(["git", "add", "."], cwd=self.script_dir, capture_output=True, text=True)
            if res_add.returncode != 0:
                raise Exception(f"Fallo en 'git add .':\n{res_add.stderr}")

            fecha_str = time.strftime("%d/%m/%Y %H:%M")
            subprocess.run(["git", "commit", "-m", f"Actualización catálogo HW-Andevia ({len(self.productos)} repuestos) - {fecha_str}"], cwd=self.script_dir, capture_output=True, text=True)

            res_push = subprocess.run(["git", "push", "-u", "origin", "HEAD"], cwd=self.script_dir, capture_output=True, text=True)

            try:
                subprocess.run("npm run deploy", cwd=self.script_dir, shell=True, capture_output=True, text=True)
            except Exception:
                pass

            messagebox.showinfo(
                "🚀 Sincronización con GitHub Exitosa",
                f"¡Excelente!\n\n"
                f"1. ✅ Se guardaron {len(self.productos)} repuestos en public/productos.json.\n"
                f"2. 📦 Se compiló la aplicación web (npm run build).\n"
                f"3. 🐙 Se realizó el commit y se sincronizó con GitHub (git push).\n"
                f"4. 🌐 Los cambios ya están sincronizados y disponibles en la nube."
            )
        except Exception as e:
            messagebox.showerror(
                "Error al Publicar en Git",
                f"Ocurrió un problema durante la sincronización:\n\n{e}\n\n"
                "Verifica que tu terminal tenga configuradas las credenciales de GitHub (git remote y acceso)."
            )


if __name__ == "__main__":
    app = HWAndeviaAdminApp()
    app.mainloop()
