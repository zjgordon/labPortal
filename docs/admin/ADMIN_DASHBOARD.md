# Admin Dashboard

The Lab Portal admin dashboard provides a comprehensive interface for managing all aspects of your laboratory control system.

## Access

Navigate to `/admin` and log in with your admin credentials to access the dashboard.

## Features

### 🎯 Main Dashboard

The main admin page provides an overview of your system with quick access to all management features.

### 📋 Card Management

- **View All Cards** - See all lab tool cards (enabled and disabled)
- **Create New Cards** - Add new lab tools to your portal
- **Edit Cards** - Modify card details, URLs, and settings
- **Reorder Cards** - Drag and drop to organize your portal layout
- **Upload Icons** - Add custom icons for each lab tool
- **Enable/Disable** - Toggle card visibility on the public portal

### 🎨 Appearance Settings

Customize your portal's branding and appearance:

- **Instance Name** - Set the portal's display name
- **Header Text** - Add custom banner text
- **Theme Settings** - Configure visual themes (future feature)

### 🧪 Experimental Features

**Control Plane Toggle** - Enable or disable experimental control plane features:

- **Location**: Bottom of the admin dashboard
- **Purpose**: Safely enable/disable advanced infrastructure management features
- **Persistence**: Setting is saved to the database and persists across restarts
- **Fallback**: Environment variable `ENABLE_CONTROL_PLANE` serves as fallback if database setting is unavailable

#### When Control Plane is Enabled:

- **Host Management** - Add and configure infrastructure hosts
- **Service Management** - Set up systemd services with permissions
- **Action History** - View and monitor all control operations
- **Quick Controls** - Start/stop/restart services directly from cards

#### When Control Plane is Disabled:

- Control plane navigation items are hidden
- Service control buttons are not displayed
- Advanced features remain safely disabled

### 🖥️ Host Management

When control plane is enabled, manage your infrastructure:

- **Add Hosts** - Register new infrastructure hosts
- **Agent Tokens** - Generate and manage secure agent tokens
- **Health Monitoring** - Track host availability and agent status
- **Service Association** - Link services to specific hosts

### ⚙️ Service Management

Configure systemd services and their permissions:

- **Service Configuration** - Set up systemd unit management
- **Permission Control** - Configure start/stop/restart permissions
- **Card Linking** - Associate services with portal cards
- **Action History** - Track all service control operations

### 📊 Action History

Monitor all control operations:

- **Action Logs** - View detailed action history
- **Status Tracking** - Monitor action success/failure rates
- **Audit Trail** - Complete tracking of who did what and when

## Security

### Authentication

- **Session-based** - Secure authentication with NextAuth.js
- **Password Protection** - Admin panel requires valid credentials
- **Session Management** - Automatic session timeout and renewal

### Access Control

- **Admin Only** - All dashboard features require admin authentication
- **CSRF Protection** - State-changing operations require valid origin headers
- **Rate Limiting** - Protection against abuse and automated attacks

## Navigation

The admin dashboard includes a persistent navigation header with:

- **Cards** - Card management interface
- **Hosts** - Host management (when control plane enabled)
- **Services** - Service management (when control plane enabled)
- **Actions** - Action history (when control plane enabled)
- **Appearance** - Portal appearance settings
- **Sign Out** - Secure logout functionality

## Best Practices

### Control Plane Management

1. **Start Disabled** - Keep control plane disabled until you're ready to test
2. **Test Thoroughly** - Verify all features work as expected before production use
3. **Monitor Actions** - Regularly check action history for any issues
4. **Backup Settings** - Export important configurations before major changes

### Security

1. **Strong Passwords** - Use strong admin passwords
2. **Regular Updates** - Keep the system updated with latest security patches
3. **Monitor Access** - Regularly review action history for unauthorized access
4. **Limit Origins** - Configure `ADMIN_ALLOWED_ORIGINS` for production deployments

## Troubleshooting

### Common Issues

**Control Plane Toggle Not Working**

- Ensure you're logged in as admin
- Check browser console for authentication errors
- Verify database connectivity

**Navigation Items Missing**

- Control plane features are hidden when disabled
- Enable via the Experimental Features toggle
- Check that the setting was saved successfully

**Action History Not Loading**

- Verify control plane is enabled
- Check database connectivity
- Review server logs for errors

### Getting Help

- Check the [comprehensive documentation](../index.md)
- Review [API documentation](../api/) for technical details
- [Open an issue](https://github.com/zjgordon/labPortal/issues) for bugs or feature requests
