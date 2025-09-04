'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  Download,
  Copy,
} from 'lucide-react';

interface Host {
  id: string;
  name: string;
  address: string | null;
  agentToken: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateHostData {
  name: string;
  address: string;
}

interface UpdateHostData {
  name: string;
  address: string;
}

export default function AdminHostsPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [agentConfigDialogOpen, setAgentConfigDialogOpen] = useState(false);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [createData, setCreateData] = useState<CreateHostData>({
    name: '',
    address: '',
  });
  const [updateData, setUpdateData] = useState<UpdateHostData>({
    name: '',
    address: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [rotating, setRotating] = useState(false);
  const { toast } = useToast();

  const fetchHosts = useCallback(async () => {
    try {
      const response = await fetch('/api/hosts');
      if (response.ok) {
        const data = await response.json();
        setHosts(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch hosts',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch hosts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHosts();
  }, [fetchHosts]);

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/hosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Host created successfully',
        });
        setCreateDialogOpen(false);
        setCreateData({ name: '', address: '' });
        fetchHosts();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to create host',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create host',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedHost) return;

    try {
      const response = await fetch(`/api/hosts/${selectedHost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Host updated successfully',
        });
        setEditDialogOpen(false);
        setSelectedHost(null);
        fetchHosts();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to update host',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update host',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedHost) return;

    try {
      const response = await fetch(`/api/hosts/${selectedHost.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Host deleted successfully',
        });
        setDeleteDialogOpen(false);
        setSelectedHost(null);
        fetchHosts();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete host',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete host',
        variant: 'destructive',
      });
    }
  };

  const handleRotateToken = async () => {
    if (!selectedHost) return;

    setRotating(true);
    try {
      const response = await fetch(`/api/hosts/${selectedHost.id}/token`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        const updatedHost = { ...selectedHost, agentToken: data.agentToken };
        setSelectedHost(updatedHost);

        // Update the hosts list to reflect the new token
        setHosts(
          hosts.map((host) =>
            host.id === selectedHost.id
              ? { ...host, agentToken: data.agentToken }
              : host
          )
        );

        toast({
          title: 'Success',
          description: 'Token rotated successfully',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to rotate token',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rotate token',
        variant: 'destructive',
      });
    } finally {
      setRotating(false);
    }
  };

  const openEditDialog = (host: Host) => {
    setSelectedHost(host);
    setUpdateData({ name: host.name, address: host.address || '' });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (host: Host) => {
    setSelectedHost(host);
    setDeleteDialogOpen(true);
  };

  const openTokenDialog = (host: Host) => {
    setSelectedHost(host);
    setTokenDialogOpen(true);
  };

  const openAgentConfigDialog = (host: Host) => {
    setSelectedHost(host);
    setAgentConfigDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Host Management</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Host
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Host</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Host Name</Label>
                <Input
                  id="name"
                  value={createData.name}
                  onChange={(e) =>
                    setCreateData({ ...createData, name: e.target.value })
                  }
                  placeholder="e.g., web-server-01"
                />
              </div>
              <div>
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  value={createData.address}
                  onChange={(e) =>
                    setCreateData({ ...createData, address: e.target.value })
                  }
                  placeholder="e.g., 192.168.1.100"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Host
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {hosts.map((host) => (
          <Card key={host.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {host.name}
                    {host.lastSeenAt && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Online
                      </span>
                    )}
                  </CardTitle>
                  {host.address && (
                    <p className="text-sm text-gray-600">{host.address}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAgentConfigDialog(host)}
                    disabled={!host.agentToken}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Agent Config
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTokenDialog(host)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Token
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(host)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(host)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Last Seen:</span>
                  <p className="text-gray-600">{formatDate(host.lastSeenAt)}</p>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="text-gray-600">{formatDate(host.createdAt)}</p>
                </div>
                <div>
                  <span className="font-medium">Agent Token:</span>
                  <p className="text-gray-600">
                    {host.agentToken ? 'Set' : 'Not set'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Updated:</span>
                  <p className="text-gray-600">{formatDate(host.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Host</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Host Name</Label>
              <Input
                id="edit-name"
                value={updateData.name}
                onChange={(e) =>
                  setUpdateData({ ...updateData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address (Optional)</Label>
              <Input
                id="edit-address"
                value={updateData.address}
                onChange={(e) =>
                  setUpdateData({ ...updateData, address: e.target.value })
                }
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">
              Update Host
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Host</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete host &quot;{selectedHost?.name}
              &quot;? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent Token - {selectedHost?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="token">Current Token</Label>
              <div className="flex gap-2">
                <Input
                  id="token"
                  value={selectedHost?.agentToken || 'No token set'}
                  readOnly
                  type={showToken ? 'text' : 'password'}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRotateToken}
                disabled={rotating}
                className="flex-1"
              >
                {rotating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Rotate Token
              </Button>
              <Button
                variant="outline"
                onClick={() => setTokenDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Config Dialog */}
      <Dialog
        open={agentConfigDialogOpen}
        onOpenChange={setAgentConfigDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Agent Configuration - {selectedHost?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {selectedHost?.agentToken && (
              <>
                {/* .env Configuration */}
                <div>
                  <Label className="text-base font-semibold">
                    Environment Configuration (.env)
                  </Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {`HOST_ID=${selectedHost.name}
PORTAL_BASE_URL=${window.location.origin}
AGENT_TOKEN=${selectedHost.agentToken}
POLL_INTERVAL=4000
EXEC_TIMEOUT_MS=60000
RESTART_RETRY=1
NODE_ENV=production`}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const envContent = `HOST_ID=${selectedHost.name}
PORTAL_BASE_URL=${window.location.origin}
AGENT_TOKEN=${selectedHost.agentToken}
POLL_INTERVAL=4000
EXEC_TIMEOUT_MS=60000
RESTART_RETRY=1
NODE_ENV=production`;
                        navigator.clipboard.writeText(envContent);
                        toast({
                          title: 'Copied',
                          description:
                            'Environment configuration copied to clipboard',
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy .env
                    </Button>
                  </div>
                </div>

                {/* Systemd Unit File */}
                <div>
                  <Label className="text-base font-semibold">
                    Systemd Service Unit
                  </Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {`[Unit]
Description=Lab Portal Agent
Documentation=https://github.com/your-org/lab-portal
After=network.target
Wants=network.target

[Service]
Type=simple
User=lab-portal
Group=lab-portal
WorkingDirectory=/opt/lab-portal-agent
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lab-portal-agent

# Environment variables
Environment=HOST_ID=${selectedHost.name}
Environment=PORTAL_BASE_URL=${window.location.origin}
Environment=AGENT_TOKEN=${selectedHost.agentToken}
Environment=POLL_INTERVAL=4000
Environment=EXEC_TIMEOUT_MS=60000
Environment=RESTART_RETRY=1
Environment=NODE_ENV=production

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/lab-portal-agent
ReadWritePaths=/var/log/lab-portal-agent

# Resource limits
LimitNOFILE=65536
MemoryMax=256M
CPUQuota=50%

[Install]
WantedBy=multi-user.target`}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const systemdContent = `[Unit]
Description=Lab Portal Agent
Documentation=https://github.com/your-org/lab-portal
After=network.target
Wants=network.target

[Service]
Type=simple
User=lab-portal
Group=lab-portal
WorkingDirectory=/opt/lab-portal-agent
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lab-portal-agent

# Environment variables
Environment=HOST_ID=${selectedHost.name}
Environment=PORTAL_BASE_URL=${window.location.origin}
Environment=AGENT_TOKEN=${selectedHost.agentToken}
Environment=POLL_INTERVAL=4000
Environment=EXEC_TIMEOUT_MS=60000
Environment=RESTART_RETRY=1
Environment=NODE_ENV=production

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/lab-portal-agent
ReadWritePaths=/var/log/lab-portal-agent

# Resource limits
LimitNOFILE=65536
MemoryMax=256M
CPUQuota=50%

[Install]
WantedBy=multi-user.target`;
                        navigator.clipboard.writeText(systemdContent);
                        toast({
                          title: 'Copied',
                          description: 'Systemd unit file copied to clipboard',
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy systemd unit
                    </Button>
                  </div>
                </div>

                {/* Installation Command */}
                <div>
                  <Label className="text-base font-semibold">
                    One-Line Installation Command
                  </Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {`sudo install -d -m755 /opt/lab-portal-agent && \\
scp -r ./agent/dist user@${selectedHost.address || 'HOST_IP'}:/opt/lab-portal-agent && \\
sudo cp ./lab-portal-agent.service /etc/systemd/system/ && \\
sudo systemctl daemon-reload && \\
sudo systemctl enable --now lab-portal-agent`}
                    </pre>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        <strong>Note:</strong> Replace <code>user@HOST_IP</code>{' '}
                        with the actual username and IP address of the target
                        host.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const installCommand = `sudo install -d -m755 /opt/lab-portal-agent && \\
scp -r ./agent/dist user@${selectedHost.address || 'HOST_IP'}:/opt/lab-portal-agent && \\
sudo cp ./lab-portal-agent.service /etc/systemd/system/ && \\
sudo systemctl daemon-reload && \\
sudo systemctl enable --now lab-portal-agent`;
                        navigator.clipboard.writeText(installCommand);
                        toast({
                          title: 'Copied',
                          description:
                            'Installation command copied to clipboard',
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy install command
                    </Button>
                  </div>
                </div>

                {/* Additional Setup Steps */}
                <div>
                  <Label className="text-base font-semibold">
                    Additional Setup Steps
                  </Label>
                  <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                    <ol className="text-sm space-y-2 list-decimal list-inside">
                      <li>
                        Create the lab-portal user:{' '}
                        <code className="bg-gray-200 px-1 rounded">
                          sudo useradd -r -s /bin/false lab-portal
                        </code>
                      </li>
                      <li>
                        Set proper ownership:{' '}
                        <code className="bg-gray-200 px-1 rounded">
                          sudo chown -R lab-portal:lab-portal
                          /opt/lab-portal-agent
                        </code>
                      </li>
                      <li>Configure sudoers for system services (optional):</li>
                    </ol>
                    <div className="mt-3 p-3 bg-gray-100 rounded text-xs font-mono">
                      <pre>{`# /etc/sudoers.d/lab-portal-agent
lab-portal ALL=(root) NOPASSWD: /bin/systemctl start *
lab-portal ALL=(root) NOPASSWD: /bin/systemctl stop *
lab-portal ALL=(root) NOPASSWD: /bin/systemctl restart *
lab-portal ALL=(root) NOPASSWD: /bin/systemctl status *`}</pre>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!selectedHost?.agentToken && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  No agent token found for this host.
                </p>
                <Button
                  onClick={() => {
                    setAgentConfigDialogOpen(false);
                    if (selectedHost) {
                      openTokenDialog(selectedHost);
                    }
                  }}
                >
                  Generate Token First
                </Button>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setAgentConfigDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
