# Dashboard Home Component

## Descripción
Componente principal del dashboard que muestra estadísticas del sistema de autorización con gráficos interactivos y métricas en tiempo real.

## Características Implementadas

### 📊 **Estadísticas Principales**
- **Usuarios**: Total, activos, inactivos, sin confirmar
- **Facturas**: Total, valor total, pagadas, pendientes, vencidas
- **Contratos**: Total, activos, expirados
- **Ingresos**: Valor total de facturación

### 📈 **Gráficos Interactivos**
- **Gráfico de Dona**: Distribución de usuarios por rol
- **Gráfico Circular**: Estado de facturas
- **Gráfico de Líneas**: Ingresos mensuales (si hay datos)

### 🔄 **Actividad Reciente**
- Últimos 5 usuarios registrados
- Últimas 5 facturas generadas
- Últimos 5 contratos creados

### 🎨 **Diseño Profesional**
- Tarjetas con iconos coloridos y gradientes
- Badges de estado con colores semánticos
- Animaciones y efectos hover
- Diseño responsive para móviles y tablets
- Consistente con el estilo de la aplicación

## Tecnologías Utilizadas

### Frontend
- **Angular 18**: Framework principal
- **PrimeNG**: Componentes UI y gráficos
- **Bootstrap 5**: Sistema de grid y utilidades
- **Bootstrap Icons**: Iconografía
- **CSS Custom Properties**: Variables de color consistentes

### Backend Integration
- **HttpClient**: Comunicación con APIs REST
- **RxJS**: Manejo de observables y datos asíncronos
- **Interceptors**: Autenticación automática

## Estructura de Archivos

```
home/
├── home.component.ts          # Lógica del componente
├── home.component.html        # Template del dashboard
├── home.component.css         # Estilos específicos
└── README.md                  # Documentación

shared/services/dashboard/
└── dashboard.service.ts       # Servicio para APIs
```

## APIs Consumidas

### GET /api/dashboard/stats
Obtiene estadísticas generales del sistema.

### GET /api/dashboard/recent-activity
Obtiene actividad reciente (últimos registros).

## Configuración

### Variables de Entorno
```typescript
// environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000'
};
```

### Proxy Configuration
```json
// proxy.conf.json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

## Uso

### Iniciar el Frontend
```bash
cd Frontend_Authoriza
npm start
```

### Acceder al Dashboard
1. Iniciar sesión en la aplicación
2. Navegar a `/home`
3. Ver las estadísticas en tiempo real

## Características de UX/UI

### Estados de Carga
- Spinner durante la carga de datos
- Mensajes de error amigables
- Placeholders mientras cargan los gráficos

### Responsive Design
- Grid adaptativo para diferentes tamaños de pantalla
- Tarjetas que se reorganizan automáticamente
- Gráficos que se ajustan al contenedor

### Accesibilidad
- Colores con suficiente contraste
- Iconos descriptivos
- Estructura semántica HTML

### Performance
- Carga asíncrona de datos
- Componentes standalone para mejor tree-shaking
- Lazy loading de gráficos

## Personalización

### Colores
Los colores se definen en `styles.css` usando CSS custom properties:
```css
:root {
  --marine-blue: hsl(213, 96%, 18%);
  --purplish-blue: hsl(243, 100%, 62%);
  --cool-gray: hsl(231, 11%, 63%);
}
```

### Gráficos
Los gráficos se pueden personalizar modificando `chartOptions` en el componente:
```typescript
this.chartOptions = {
  plugins: {
    legend: { position: 'bottom' }
  },
  responsive: true
};
```

## Mantenimiento

### Agregar Nuevas Métricas
1. Actualizar `DashboardStats` interface
2. Modificar el servicio para consumir nuevos endpoints
3. Agregar la visualización en el template
4. Actualizar los estilos si es necesario

### Nuevos Gráficos
1. Instalar dependencias si es necesario
2. Importar componentes de PrimeNG
3. Preparar datos en `prepareChartData()`
4. Agregar al template con configuración apropiada