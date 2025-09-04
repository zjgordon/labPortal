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
import { QRCodeComponent } from '@/components/qr-code';
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
  QrCode,
  Terminal,
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
  const [showQrCode, setShowQrCode] = useState(false);
  const [tarballAvailable, setTarballAvailable] = useState(false);
  const [tarballInfo, setTarballInfo] = useState<{
    tarballName?: string;
    hasChecksum?: boolean;
    checksumName?: string;
  }>({});
  const [checksumData, setChecksumData] = useState<{
    filename?: string;
    sha256?: string;
    checksumFile?: string;
  }>({});
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
    checkTarballAvailability();
  };

  const checkTarballAvailability = async () => {
    try {
      // Check if tarball exists in dist-artifacts
      const response = await fetch('/api/public/tarball-check');
      if (response.ok) {
        const data = await response.json();
        setTarballAvailable(data.available);
        // Store additional tarball info for display
        if (data.available) {
          setTarballInfo({
            tarballName: data.tarballName,
            hasChecksum: data.hasChecksum,
            checksumName: data.checksumName,
          });

          // If checksum is available, fetch the checksum data
          if (data.hasChecksum) {
            fetchChecksumData();
          }
        }
      }
    } catch (error) {
      // If API doesn't exist, assume tarball is not available
      setTarballAvailable(false);
    }
  };

  const fetchChecksumData = async () => {
    try {
      const response = await fetch('/api/public/tarball-checksum');
      if (response.ok) {
        const data = await response.json();
        setChecksumData({
          filename: data.filename,
          sha256: data.sha256,
          checksumFile: data.checksumFile,
        });
      }
    } catch (error) {
      console.error('Failed to fetch checksum data:', error);
    }
  };

  const generateQrData = (host: Host) => {
    const portalUrl = window.location.origin;
    const qrData = {
      portal: portalUrl,
      hostId: host.name,
      token: host.agentToken,
      installCommand: `curl -sSL ${portalUrl}/api/public/install-script | sudo bash -s -- --host-id ${host.name} --portal ${portalUrl} --token ${host.agentToken}`,
    };
    return JSON.stringify(qrData);
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
                {/* Download Tarball Section */}
                <div>
                  <Label className="text-base font-semibold">
                    Download Agent Package
                  </Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    {tarballAvailable ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Download the pre-built agent package:
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const downloadUrl = `${window.location.origin}/api/public/download-tarball`;
                              window.open(downloadUrl, '_blank');
                              toast({
                                title: 'Download Started',
                                description: 'Agent tarball download initiated',
                              });
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Tarball
                          </Button>
                          {tarballInfo.hasChecksum && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const downloadUrl = `${window.location.origin}/api/public/download-checksum`;
                                window.open(downloadUrl, '_blank');
                                toast({
                                  title: 'Download Started',
                                  description:
                                    'Checksum file download initiated',
                                });
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Checksum
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const downloadCommand = `wget ${window.location.origin}/api/public/download-tarball -O agent-labportal.tgz`;
                              navigator.clipboard.writeText(downloadCommand);
                              toast({
                                title: 'Copied',
                                description:
                                  'Download command copied to clipboard',
                              });
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy wget command
                          </Button>
                        </div>
                        {tarballInfo.hasChecksum && checksumData.sha256 && (
                          <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                            <p className="text-sm text-green-800 font-medium mb-2">
                              ✅ SHA256 Checksum Available
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <code className="bg-green-100 px-2 py-1 rounded text-xs font-mono flex-1 break-all">
                                  {checksumData.sha256}
                                </code>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      checksumData.sha256 || ''
                                    );
                                    toast({
                                      title: 'Copied',
                                      description:
                                        'SHA256 checksum copied to clipboard',
                                    });
                                  }}
                                  className="text-xs px-2 py-1 h-auto"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <p className="text-xs text-green-700">
                                Verify integrity with:{' '}
                                <code className="bg-green-100 px-1 rounded">
                                  sha256sum -c {checksumData.checksumFile}
                                </code>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          No pre-built tarball available. Build locally:
                        </p>
                        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                          <pre className="text-sm font-mono whitespace-pre-wrap">
                            {`# Build agent package locally
make agent-build
make agent-package

# This creates: dist-artifacts/agent-labportal-*.tgz`}
                          </pre>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const buildCommand = `make agent-build && make agent-package`;
                            navigator.clipboard.writeText(buildCommand);
                            toast({
                              title: 'Copied',
                              description: 'Build command copied to clipboard',
                            });
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy build command
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Section */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      Quick Setup QR Code
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQrCode(!showQrCode)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {showQrCode ? 'Hide' : 'Show'} QR Code
                    </Button>
                  </div>
                  {showQrCode && selectedHost && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center p-4 bg-white rounded border">
                        <div className="text-center">
                          <QRCodeComponent
                            data={generateQrData(selectedHost)}
                            size={128}
                            className="mb-2"
                          />
                          <p className="text-xs text-gray-500">
                            QR Code: {selectedHost.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Scan with mobile device
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-600">
                        <p>
                          <strong>QR Data:</strong> Contains portal URL, host
                          ID, and one-click install command
                        </p>
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                          {generateQrData(selectedHost)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TUI and CLI Commands */}
                <div>
                  <Label className="text-base font-semibold">
                    Installation Commands
                  </Label>
                  <div className="mt-2 space-y-4">
                    {/* Interactive TUI Installation */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Terminal className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          Interactive Installation (Recommended)
                        </span>
                      </div>
                      <pre className="text-sm font-mono whitespace-pre-wrap bg-white p-3 rounded border">
                        {`# Download and run guided installer
curl -sSL ${window.location.origin}/api/public/install-script | sudo bash

# Or if you have the tarball:
tar -xzf agent-labportal-*.tgz
cd agent-labportal-*
sudo ./packaging/install-guided.sh`}
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          const tuiCommand = `curl -sSL ${window.location.origin}/api/public/install-script | sudo bash`;
                          navigator.clipboard.writeText(tuiCommand);
                          toast({
                            title: 'Copied',
                            description:
                              'Interactive install command copied to clipboard',
                          });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy TUI command
                      </Button>
                    </div>

                    {/* Non-interactive CLI Installation */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Terminal className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          Non-Interactive Installation
                        </span>
                      </div>
                      <pre className="text-sm font-mono whitespace-pre-wrap bg-white p-3 rounded border">
                        {`# One-line non-interactive installation
curl -sSL ${window.location.origin}/api/public/install-script | sudo bash -s -- \\
  --host-id ${selectedHost.name} \\
  --portal ${window.location.origin} \\
  --token ${selectedHost.agentToken} \\
  --assume-yes`}
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          const cliCommand = `curl -sSL ${window.location.origin}/api/public/install-script | sudo bash -s -- --host-id ${selectedHost.name} --portal ${window.location.origin} --token ${selectedHost.agentToken} --assume-yes`;
                          navigator.clipboard.writeText(cliCommand);
                          toast({
                            title: 'Copied',
                            description:
                              'Non-interactive install command copied to clipboard',
                          });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy CLI command
                      </Button>
                    </div>
                  </div>
                </div>

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
