# AUTHORIZA - Access Control System

Frontend application for managing access control for CycloNet applications.

## Project Overview

AUTHORIZA is a comprehensive access control and user management system designed specifically for CycloNet applications. It allows administrators to manage:

- Applications
- Users
- Roles
- Menu Options
- Access Permissions

## Technology Stack

- **Framework**: Angular
- **Styling**: Bootstrap 5
- **Icons**: Bootstrap Icons
- **HTTP Client**: Angular HttpClient
- **State Management**: BehaviorSubject pattern
- **CSS Pre-processor**: SCSS

## Features

- Application management with CRUD operations
- Role-based access control
- User management
- Dynamic menu configuration
- Interactive UI with notifications

## Project Structure

```
src/
├── app/
│   ├── config/         # Application configuration
│   ├── feature/        # Feature modules (applications, users, roles, etc.)
│   └── shared/         # Shared components, services, and models
├── assets/
│   ├── img/            # Images and logos
│   ├── js/             # Client-side JavaScript
│   ├── scss/           # SCSS styling
│   └── icons/          # SVG icons
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Angular CLI

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   ng serve
   ```
4. Open your browser and navigate to `http://localhost:4200`

## Theme Customization

The application uses CSS variables for theming. You can modify colors in:

- `src/assets/scss/styles.scss` - Global variables
- `src/app/config/config.ts` - Theme configuration variables

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- CycloNet S.A.S. for supporting this project
