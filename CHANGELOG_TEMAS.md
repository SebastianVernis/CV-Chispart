# Changelog: Sistema de Temas y Personalización Visual

## Versión 1.1.0 - Actualización de Personalización y IA

### Cambios Principales
- **Proveedor de IA**: Migración exclusiva a Blackbox AI
- **Sistema de Temas**: Implementación de temas visuales personalizables
- **Tipografía**: Opciones de fuente y tamaño de texto
- **Configuración Visual**: Nuevos controles para personalizar apariencia del CV

### Características Nuevas
- 5 temas predefinidos:
  - Profesional (Gris/Teal)
  - Moderno (Azul/Negro)
  - Creativo (Púrpura/Naranja)
  - Minimalista (Negro/Blanco)
  - Cálido (Marrón/Crema)

- Opciones de Tipografía:
  - Inter (Sans-serif)
  - Roboto (Sans-serif)
  - Lato (Sans-serif)
  - Merriweather (Serif)
  - Playfair Display (Serif)

- Tamaños de Fuente:
  - Pequeño (12px)
  - Mediano (14px)
  - Grande (16px)

### Archivos Modificados
- `src/ai-providers.js`: Eliminación de otros proveedores, mantener solo Blackbox
- `public/editor.html`: Añadir controles de tema y tipografía
- `public/preview.html`: Implementar lógica de aplicación de temas
- `tests/ai.test.js`: Actualizar pruebas para Blackbox
- `.env.example`: Eliminar claves de otros proveedores

### Mejoras Técnicas
- Modularización de configuración de temas
- Soporte para temas dinámicos
- Mejor experiencia de personalización visual

### Próximos Pasos
- Más temas personalizables
- Selector de colores personalizado
- Exportación de configuraciones de tema