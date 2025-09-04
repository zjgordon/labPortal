# Sudoers Configuration Examples

This document provides example sudoers configurations for allowing the Lab Portal to execute systemctl commands on behalf of users. These configurations should be added to `/etc/sudoers.d/lab-portal` or similar.

## Security Considerations

- **Principle of Least Privilege**: Only grant the minimum permissions necessary
- **Specific Commands**: Use specific command paths and arguments
- **User Restrictions**: Limit which users can execute these commands
- **Logging**: Enable command logging for audit trails
- **Regular Review**: Periodically review and update these permissions

## Example Configurations

### 1. Basic System Service Management

Allow the `www-data` user (typical web server user) to manage specific system services:

```bash
# Allow www-data to manage specific services
www-data ALL=(root) NOPASSWD: /bin/systemctl start nginx.service
www-data ALL=(root) NOPASSWD: /bin/systemctl stop nginx.service
www-data ALL=(root) NOPASSWD: /bin/systemctl restart nginx.service
www-data ALL=(root) NOPASSWD: /bin/systemctl status nginx.service

# Allow management of multiple services
www-data ALL=(root) NOPASSWD: /bin/systemctl start grafana-server.service
www-data ALL=(root) NOPASSWD: /bin/systemctl stop grafana-server.service
www-data ALL=(root) NOPASSWD: /bin/systemctl restart grafana-server.service
www-data ALL=(root) NOPASSWD: /bin/systemctl status grafana-server.service
```

### 2. Pattern-Based Service Management

For environments with many similar services, use pattern matching:

```bash
# Allow management of services matching specific patterns
www-data ALL=(root) NOPASSWD: /bin/systemctl start lab-*.service
www-data ALL=(root) NOPASSWD: /bin/systemctl stop lab-*.service
www-data ALL=(root) NOPASSWD: /bin/systemctl restart lab-*.service
www-data ALL=(root) NOPASSWD: /bin/systemctl status lab-*.service

# Allow management of monitoring services
www-data ALL=(root) NOPASSWD: /bin/systemctl start prometheus.service
www-data ALL=(root) NOPASSWD: /bin/systemctl stop prometheus.service
www-data ALL=(root) NOPASSWD: /bin/systemctl restart prometheus.service
www-data ALL=(root) NOPASSWD: /bin/systemctl status prometheus.service

www-data ALL=(root) NOPASSWD: /bin/systemctl start node_exporter.service
www-data ALL=(root) NOPASSWD: /bin/systemctl stop node_exporter.service
www-data ALL=(root) NOPASSWD: /bin/systemctl restart node_exporter.service
www-data ALL=(root) NOPASSWD: /bin/systemctl status node_exporter.service
```

### 3. Development Environment Configuration

For development environments with multiple services:

```bash
# Development services
www-data ALL=(root) NOPASSWD: /bin/systemctl start docker.service
www-data ALL=(root) NOPASSWD: /bin/systemctl stop docker.service
www-data ALL=(root) NOPASSWD: /bin/systemctl restart docker.service
www-data ALL=(root) NOPASSWD: /bin/systemctl status docker.service

# Database services
www-data ALL=(root) NOPASSWD: /bin/systemctl start postgresql.service
www-data ALL=(root) NOPASSWD: /bin/systemctl stop postgresql.service
www-data ALL=(root) NOPASSWD: /bin/systemctl restart postgresql.service
www-data ALL=(root) NOPASSWD: /bin/systemctl status postgresql.service

# Web services
www-data ALL=(root) NOPASSWD: /bin/systemctl start apache2.service
www-data ALL=(root) NOPASSWD: /bin/systemctl stop apache2.service
www-data ALL=(root) NOPASSWD: /bin/systemctl restart apache2.service
www-data ALL=(root) NOPASSWD: /bin/systemctl status apache2.service
```

### 4. Restricted User Services (Recommended)

For better security, prefer user services over system services:

```bash
# Allow management of user services (no sudo required)
# These commands run as the web server user
www-data ALL=(www-data) NOPASSWD: /bin/systemctl --user start lab-portal.service
www-data ALL=(www-data) NOPASSWD: /bin/systemctl --user stop lab-portal.service
www-data ALL=(www-data) NOPASSWD: /bin/systemctl --user restart lab-portal.service
www-data ALL=(www-data) NOPASSWD: /bin/systemctl --user status lab-portal.service
```

### 5. With Command Logging

Enable logging for audit trails:

```bash
# Enable logging for all systemctl commands
www-data ALL=(root) NOPASSWD: /bin/systemctl start nginx.service
www-data ALL=(root) NOPASSWD: /bin/systemctl stop nginx.service
www-data ALL=(root) NOPASSWD: /bin/systemctl restart nginx.service
www-data ALL=(root) NOPASSWD: /bin/systemctl status nginx.service

# Log all commands (add to main sudoers file)
Defaults logfile=/var/log/sudo.log
Defaults log_input, log_output
```

## Installation Instructions

### 1. Create the sudoers file

```bash
sudo nano /etc/sudoers.d/lab-portal
```

### 2. Add the appropriate configuration

Copy one of the example configurations above and modify it for your environment.

### 3. Set proper permissions

```bash
sudo chmod 440 /etc/sudoers.d/lab-portal
```

### 4. Validate the configuration

```bash
sudo visudo -c
```

### 5. Test the configuration

```bash
# Test as the web server user
sudo -u www-data sudo systemctl status nginx.service
```

## Environment-Specific Examples

### Docker Environment

If running in Docker, the web server might run as a different user:

```bash
# For Docker containers running as 'node' user
node ALL=(root) NOPASSWD: /bin/systemctl start docker.service
node ALL=(root) NOPASSWD: /bin/systemctl stop docker.service
node ALL=(root) NOPASSWD: /bin/systemctl restart docker.service
node ALL=(root) NOPASSWD: /bin/systemctl status docker.service
```

### Kubernetes Environment

For Kubernetes deployments, consider using service accounts and RBAC instead of sudoers.

### Multi-User Environment

For environments with multiple users managing different services:

```bash
# User-specific service management
alice ALL=(root) NOPASSWD: /bin/systemctl start alice-*.service
alice ALL=(root) NOPASSWD: /bin/systemctl stop alice-*.service
alice ALL=(root) NOPASSWD: /bin/systemctl restart alice-*.service
alice ALL=(root) NOPASSWD: /bin/systemctl status alice-*.service

bob ALL=(root) NOPASSWD: /bin/systemctl start bob-*.service
bob ALL=(root) NOPASSWD: /bin/systemctl stop bob-*.service
bob ALL=(root) NOPASSWD: /bin/systemctl restart bob-*.service
bob ALL=(root) NOPASSWD: /bin/systemctl status bob-*.service
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the user has the correct sudoers entry
2. **Command Not Found**: Verify the full path to systemctl (`/bin/systemctl`)
3. **Service Not Found**: Check that the service name matches exactly
4. **Logging Issues**: Ensure log directories exist and are writable

### Testing Commands

```bash
# Test sudo access
sudo -u www-data sudo systemctl status nginx.service

# Check sudoers syntax
sudo visudo -c

# View sudo logs
sudo tail -f /var/log/sudo.log
```

### Security Validation

```bash
# Verify only intended commands are allowed
sudo -u www-data sudo systemctl --help  # Should fail
sudo -u www-data sudo systemctl status nginx.service  # Should work
```

## Best Practices

1. **Use Specific Commands**: Avoid wildcards when possible
2. **Regular Audits**: Review sudoers entries periodically
3. **Minimal Permissions**: Only grant what's necessary
4. **Documentation**: Keep track of why each permission was granted
5. **Testing**: Test configurations in a safe environment first
6. **Backup**: Keep backups of working configurations
7. **Monitoring**: Monitor sudo logs for unusual activity

## Integration with Lab Portal

The Lab Portal will automatically use these sudoers configurations when:

1. `ALLOW_SYSTEMCTL=true` is set in the environment
2. The service unit name matches the `UNIT_ALLOWLIST_REGEX`
3. The action is for the local host (`HOST_LOCAL_ID`)

The system will prefer user services (`systemctl --user`) over system services (`sudo systemctl`) when possible, providing better security isolation.
