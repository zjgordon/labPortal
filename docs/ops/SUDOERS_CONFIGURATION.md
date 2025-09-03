# Sudoers Configuration for Safe Systemctl Execution

This document provides the necessary sudoers configuration to enable safe systemctl execution for the Lab Portal while maintaining security.

## Overview

When `ALLOW_SYSTEMCTL=true` is set, the portal can execute systemctl commands using `sudo`. This requires careful sudoers configuration to limit privileges and prevent security issues.

## Security Principles

1. **Principle of Least Privilege**: Only allow the specific commands needed
2. **Command Validation**: Restrict to safe systemctl operations only
3. **User Limitation**: Limit to specific users/groups
4. **No Shell Access**: Prevent escalation to shell access
5. **Audit Trail**: Log all sudo usage

## Basic Sudoers Configuration

### Option 1: Dedicated Service User (Recommended)

Create a dedicated user for the portal and grant limited sudo access:

```bash
# Create dedicated user
sudo useradd -r -s /bin/false lab-portal

# Add to sudoers with limited privileges
sudo visudo -f /etc/sudoers.d/lab-portal
```

Add this content to `/etc/sudoers.d/lab-portal`:

```sudoers
# Lab Portal systemctl access
lab-portal ALL=(root) NOPASSWD: /usr/bin/systemctl start [a-zA-Z0-9@._-]*.service
lab-portal ALL=(root) NOPASSWD: /usr/bin/systemctl stop [a-zA-Z0-9@._-]*.service
lab-portal ALL=(root) NOPASSWD: /usr/bin/systemctl restart [a-zA-Z0-9@._-]*.service
lab-portal ALL=(root) NOPASSWD: /usr/bin/systemctl status [a-zA-Z0-9@._-]*.service

# Prevent shell access
lab-portal ALL=(ALL) !/bin/bash, !/bin/sh, !/bin/dash, !/bin/zsh
```

### Option 2: Existing User with Limited Access

If using an existing user (e.g., `www-data` for web servers):

```sudoers
# Web server user systemctl access
www-data ALL=(root) NOPASSWD: /usr/bin/systemctl start [a-zA-Z0-9@._-]*.service
www-data ALL=(root) NOPASSWD: /usr/bin/systemctl stop [a-zA-Z0-9@._-]*.service
www-data ALL=(root) NOPASSWD: /usr/bin/systemctl restart [a-zA-Z0-9@._-]*.service
www-data ALL=(root) NOPASSWD: /usr/bin/systemctl status [a-zA-Z0-9@._-]*.service

# Prevent shell access
www-data ALL=(ALL) !/bin/bash, !/bin/sh, !/bin/dash, !/bin/zsh
```

### Option 3: Group-Based Access

Create a group and grant access to all members:

```bash
# Create group
sudo groupadd lab-portal-admin

# Add users to group
sudo usermod -a -G lab-portal-admin www-data
sudo usermod -a -G lab-portal-admin lab-portal
```

Add to `/etc/sudoers.d/lab-portal`:

```sudoers
# Lab Portal admin group
%lab-portal-admin ALL=(root) NOPASSWD: /usr/bin/systemctl start [a-zA-Z0-9@._-]*.service
%lab-portal-admin ALL=(root) NOPASSWD: /usr/bin/systemctl stop [a-zA-Z0-9@._-]*.service
%lab-portal-admin ALL=(root) NOPASSWD: /usr/bin/systemctl restart [a-zA-Z0-9@._-]*.service
%lab-portal-admin ALL=(root) NOPASSWD: /usr/bin/systemctl status [a-zA-Z0-9@._-]*.service

# Prevent shell access
%lab-portal-admin ALL=(ALL) !/bin/bash, !/bin/sh, !/bin/dash, !/bin/zsh
```

## Advanced Security Configuration

### 1. Command Argument Validation

For stricter control, use argument validation:

```sudoers
# Strict argument validation
lab-portal ALL=(root) NOPASSWD: /usr/bin/systemctl start [a-zA-Z0-9@._-]*\.service
lab-portal ALL=(root) NOPASSWD: /usr/bin/systemctl stop [a-zA-Z0-9@._-]*\.service
lab-portal ALL=(root) NOPASSWD: /usr/bin/systemctl restart [a-zA-Z0-9@._-]*\.service
lab-portal ALL=(root) NOPASSWD: /usr/bin/systemctl status [a-zA-Z0-9@._-]*\.service

# Alternative: Use command aliases
Cmnd_Alias LAB_PORTAL_SYSTEMCTL = /usr/bin/systemctl start [a-zA-Z0-9@._-]*.service, \
                                   /usr/bin/systemctl stop [a-zA-Z0-9@._-]*.service, \
                                   /usr/bin/systemctl restart [a-zA-Z0-9@._-]*.service, \
                                   /usr/bin/systemctl status [a-zA-Z0-9@._-]*.service

lab-portal ALL=(root) NOPASSWD: LAB_PORTAL_SYSTEMCTL
```

### 2. Environment Variable Restrictions

Restrict environment variables to prevent privilege escalation:

```sudoers
# Restrict environment variables
Defaults:lab-portal env_reset
Defaults:lab-portal secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Defaults:lab-portal !env_keep

lab-portal ALL=(root) NOPASSWD: LAB_PORTAL_SYSTEMCTL
```

### 3. Logging and Monitoring

Enable comprehensive logging:

```sudoers
# Enable logging
Defaults log_host, log_year, logfile=/var/log/sudo.log
Defaults:lab-portal log_output

lab-portal ALL=(root) NOPASSWD: LAB_PORTAL_SYSTEMCTL
```

## Docker Configuration

When running in Docker, the user inside the container needs sudo access on the host. This requires special configuration:

### Option 1: Host User Mapping

Map the container user to a host user with sudo access:

```dockerfile
# In Dockerfile
RUN useradd -r -s /bin/false -u 1001 lab-portal
USER lab-portal
```

```yaml
# In docker-compose.yml
services:
  lab-portal:
    user: "1001:1001"  # Map to host user
    volumes:
      - /etc/sudoers.d:/etc/sudoers.d:ro
      - /var/run/dbus:/var/run/dbus
```

### Option 2: Host Sudo Access

Grant sudo access to the user running the Docker container:

```bash
# Add docker user to sudoers
echo "docker ALL=(root) NOPASSWD: LAB_PORTAL_SYSTEMCTL" | sudo tee /etc/sudoers.d/docker-lab-portal
```

## Testing the Configuration

### 1. Test Sudo Access

```bash
# Test as the configured user
sudo -u lab-portal sudo systemctl status ssh.service

# Should work without password prompt
```

### 2. Test Security Restrictions

```bash
# These should fail
sudo -u lab-portal sudo systemctl start malicious.service
sudo -u lab-portal sudo /bin/bash
sudo -u lab-portal sudo cat /etc/shadow
```

### 3. Verify Logging

```bash
# Check sudo logs
sudo tail -f /var/log/sudo.log
sudo journalctl -u sudo
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check if user is in correct group
   - Verify sudoers file syntax
   - Check file permissions on sudoers.d

2. **Command Not Found**
   - Ensure full path to systemctl
   - Check secure_path in sudoers
   - Verify systemctl location

3. **Authentication Failures**
   - Check NOPASSWD directive
   - Verify user/group names
   - Check sudoers file syntax

### Debug Commands

```bash
# Check sudo configuration
sudo -l -U lab-portal

# Test specific command
sudo -u lab-portal sudo -n systemctl status ssh.service

# Check sudoers syntax
sudo visudo -c

# View effective sudoers
sudo cat /etc/sudoers
sudo cat /etc/sudoers.d/*
```

## Security Considerations

### 1. Regular Auditing
- Monitor sudo logs regularly
- Review sudoers configuration periodically
- Check for unauthorized access attempts

### 2. Principle of Least Privilege
- Only grant access to necessary commands
- Restrict to specific service patterns
- Prevent shell access and file operations

### 3. Network Security
- Ensure portal is not exposed to public internet
- Use firewall rules to restrict access
- Monitor network connections

### 4. Update Procedures
- Test sudoers changes in staging first
- Have backup sudoers configuration
- Document all changes

## Example Complete Configuration

Here's a complete example for a production environment:

```bash
# /etc/sudoers.d/lab-portal
# Lab Portal systemctl access with comprehensive security

# Command aliases
Cmnd_Alias LAB_PORTAL_SYSTEMCTL = /usr/bin/systemctl start [a-zA-Z0-9@._-]*.service, \
                                   /usr/bin/systemctl stop [a-zA-Z0-9@._-]*.service, \
                                   /usr/bin/systemctl restart [a-zA-Z0-9@._-]*.service, \
                                   /usr/bin/systemctl status [a-zA-Z0-9@._-]*.service

# User configuration
lab-portal ALL=(root) NOPASSWD: LAB_PORTAL_SYSTEMCTL

# Security defaults
Defaults:lab-portal env_reset
Defaults:lab-portal secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Defaults:lab-portal !env_keep
Defaults:lab-portal log_output

# Prevent shell access
lab-portal ALL=(ALL) !/bin/bash, !/bin/sh, !/bin/dash, !/bin/zsh, !/bin/ksh
```

This configuration provides secure, auditable access to systemctl commands while maintaining system security.
