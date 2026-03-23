import { useState } from 'react';
import { Save, Bell, Shield, Upload, Globe, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [systemSettings, setSystemSettings] = useState({
    requestTimeout: 30,
    defaultLanguage: 'vi',
    maxUploadSize: 10,
    maintenanceMode: false,
    debugMode: false,
  });

  const [moderationSettings, setModerationSettings] = useState({
    riskScoreThresholdLow: 30,
    riskScoreThresholdHigh: 70,
    autoFlagEnabled: true,
    requireApprovalAboveThreshold: true,
  });

  const [broadcastDraft, setBroadcastDraft] = useState({
    title: '',
    content: '',
    targetRoles: [] as string[],
    scheduledAt: '',
  });

  const handleSaveSystemSettings = () => {
    toast.success('Cài đặt hệ thống đã được lưu');
  };

  const handleSaveModerationSettings = () => {
    toast.success('Cài đặt kiểm duyệt đã được lưu');
  };

  const handleSaveBroadcast = () => {
    if (!broadcastDraft.title || !broadcastDraft.content) {
      toast.error('Vui lòng điền tiêu đề và nội dung thông báo');
      return;
    }
    toast.success('Bản nháp thông báo đã được lưu');
  };

  const handleSendBroadcast = () => {
    if (!broadcastDraft.title || !broadcastDraft.content) {
      toast.error('Vui lòng điền tiêu đề và nội dung thông báo');
      return;
    }
    toast.success('Thông báo đã được gửi thành công');
    setBroadcastDraft({ title: '', content: '', targetRoles: [], scheduledAt: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Cài đặt</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý cấu hình hệ thống và các tùy chọn nâng cao
        </p>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="system" className="gap-2">
            <Globe className="h-4 w-4" />
            Hệ thống
          </TabsTrigger>
          <TabsTrigger value="moderation" className="gap-2">
            <Shield className="h-4 w-4" />
            Kiểm duyệt
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-2">
            <Bell className="h-4 w-4" />
            Thông báo
          </TabsTrigger>
        </TabsList>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt chung</CardTitle>
              <CardDescription>
                Cấu hình các thông số cơ bản của hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Thời gian chờ request (giây)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min={5}
                    max={120}
                    value={systemSettings.requestTimeout}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        requestTimeout: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Thời gian tối đa chờ phản hồi từ server (5-120 giây)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Ngôn ngữ mặc định</Label>
                  <Select
                    value={systemSettings.defaultLanguage}
                    onValueChange={(value) =>
                      setSystemSettings({ ...systemSettings, defaultLanguage: value })
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Ngôn ngữ hiển thị mặc định cho người dùng mới
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload-size">Giới hạn upload (MB)</Label>
                  <Input
                    id="upload-size"
                    type="number"
                    min={1}
                    max={100}
                    value={systemSettings.maxUploadSize}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        maxUploadSize: parseInt(e.target.value) || 10,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Dung lượng tối đa cho mỗi file upload (1-100 MB)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Kích thước ảnh tối đa</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue={1920} className="w-24" />
                    <span className="text-muted-foreground">x</span>
                    <Input type="number" defaultValue={1080} className="w-24" />
                    <span className="text-muted-foreground">px</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ảnh lớn hơn sẽ được tự động resize
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Chế độ đặc biệt</h4>
                
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance">Chế độ bảo trì</Label>
                    <p className="text-xs text-muted-foreground">
                      Tạm ngưng truy cập hệ thống để bảo trì
                    </p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setSystemSettings({ ...systemSettings, maintenanceMode: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="debug">Chế độ debug</Label>
                    <p className="text-xs text-muted-foreground">
                      Hiển thị thông tin debug chi tiết (chỉ dành cho developer)
                    </p>
                  </div>
                  <Switch
                    id="debug"
                    checked={systemSettings.debugMode}
                    onCheckedChange={(checked) =>
                      setSystemSettings({ ...systemSettings, debugMode: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSystemSettings} className="gap-2">
                  <Save className="h-4 w-4" />
                  Lưu cài đặt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Settings Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ngưỡng điểm rủi ro</CardTitle>
              <CardDescription>
                Cấu hình ngưỡng điểm để phân loại và kiểm duyệt nội dung tự động
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Ngưỡng thấp (Low Risk)</Label>
                    <span className="text-sm font-medium text-emerald-600">
                      {moderationSettings.riskScoreThresholdLow}
                    </span>
                  </div>
                  <Slider
                    value={[moderationSettings.riskScoreThresholdLow]}
                    onValueChange={([value]) =>
                      setModerationSettings({
                        ...moderationSettings,
                        riskScoreThresholdLow: value,
                      })
                    }
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nội dung có điểm rủi ro dưới ngưỡng này được coi là an toàn
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Ngưỡng cao (High Risk)</Label>
                    <span className="text-sm font-medium text-red-600">
                      {moderationSettings.riskScoreThresholdHigh}
                    </span>
                  </div>
                  <Slider
                    value={[moderationSettings.riskScoreThresholdHigh]}
                    onValueChange={([value]) =>
                      setModerationSettings({
                        ...moderationSettings,
                        riskScoreThresholdHigh: value,
                      })
                    }
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nội dung có điểm rủi ro trên ngưỡng này sẽ bị flag tự động
                  </p>
                </div>

                {/* Risk Score Visualization */}
                <div className="rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Phân vùng điểm rủi ro</span>
                  </div>
                  <div className="h-4 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${moderationSettings.riskScoreThresholdLow}%` }}
                    />
                    <div
                      className="bg-amber-500 transition-all"
                      style={{
                        width: `${moderationSettings.riskScoreThresholdHigh - moderationSettings.riskScoreThresholdLow}%`,
                      }}
                    />
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${100 - moderationSettings.riskScoreThresholdHigh}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>An toàn (0-{moderationSettings.riskScoreThresholdLow})</span>
                    <span>Cần xem xét ({moderationSettings.riskScoreThresholdLow}-{moderationSettings.riskScoreThresholdHigh})</span>
                    <span>Rủi ro cao ({moderationSettings.riskScoreThresholdHigh}-100)</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Tùy chọn kiểm duyệt</h4>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-flag">Tự động flag nội dung rủi ro cao</Label>
                    <p className="text-xs text-muted-foreground">
                      Tự động chuyển trạng thái sang flagged khi vượt ngưỡng cao
                    </p>
                  </div>
                  <Switch
                    id="auto-flag"
                    checked={moderationSettings.autoFlagEnabled}
                    onCheckedChange={(checked) =>
                      setModerationSettings({ ...moderationSettings, autoFlagEnabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="require-approval">Yêu cầu phê duyệt</Label>
                    <p className="text-xs text-muted-foreground">
                      Nội dung vượt ngưỡng cao cần admin phê duyệt trước khi publish
                    </p>
                  </div>
                  <Switch
                    id="require-approval"
                    checked={moderationSettings.requireApprovalAboveThreshold}
                    onCheckedChange={(checked) =>
                      setModerationSettings({
                        ...moderationSettings,
                        requireApprovalAboveThreshold: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveModerationSettings} className="gap-2">
                  <Save className="h-4 w-4" />
                  Lưu cài đặt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Broadcast Tab */}
        <TabsContent value="broadcast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông báo nội bộ</CardTitle>
              <CardDescription>
                Gửi thông báo đến người dùng trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="broadcast-title">Tiêu đề thông báo</Label>
                  <Input
                    id="broadcast-title"
                    placeholder="Nhập tiêu đề thông báo..."
                    value={broadcastDraft.title}
                    onChange={(e) =>
                      setBroadcastDraft({ ...broadcastDraft, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="broadcast-content">Nội dung</Label>
                  <Textarea
                    id="broadcast-content"
                    placeholder="Nhập nội dung thông báo..."
                    rows={5}
                    value={broadcastDraft.content}
                    onChange={(e) =>
                      setBroadcastDraft({ ...broadcastDraft, content: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Đối tượng nhận</Label>
                    <Select
                      value={broadcastDraft.targetRoles.join(',') || 'all'}
                      onValueChange={(value) =>
                        setBroadcastDraft({
                          ...broadcastDraft,
                          targetRoles: value === 'all' ? [] : [value],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đối tượng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả người dùng</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="customer">Khách hàng</SelectItem>
                        <SelectItem value="store_owner">Chủ cửa hàng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled">Hẹn giờ gửi (tùy chọn)</Label>
                    <Input
                      id="scheduled"
                      type="datetime-local"
                      value={broadcastDraft.scheduledAt}
                      onChange={(e) =>
                        setBroadcastDraft({ ...broadcastDraft, scheduledAt: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Preview */}
              {(broadcastDraft.title || broadcastDraft.content) && (
                <div className="space-y-2">
                  <Label>Xem trước</Label>
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">
                          {broadcastDraft.title || 'Tiêu đề thông báo'}
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {broadcastDraft.content || 'Nội dung thông báo sẽ hiển thị ở đây...'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {broadcastDraft.scheduledAt
                            ? `Hẹn gửi: ${new Date(broadcastDraft.scheduledAt).toLocaleString('vi-VN')}`
                            : 'Gửi ngay'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleSaveBroadcast}>
                  Lưu bản nháp
                </Button>
                <Button onClick={handleSendBroadcast} className="gap-2">
                  <Bell className="h-4 w-4" />
                  {broadcastDraft.scheduledAt ? 'Hẹn gửi' : 'Gửi ngay'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Broadcasts */}
          <Card>
            <CardHeader>
              <CardTitle>Thông báo gần đây</CardTitle>
              <CardDescription>
                Lịch sử các thông báo đã gửi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: 'Bảo trì hệ thống',
                    content: 'Hệ thống sẽ được bảo trì từ 22:00 - 24:00 ngày 20/03/2026',
                    sentAt: '2026-03-18T10:00:00',
                    recipients: 156,
                  },
                  {
                    title: 'Cập nhật tính năng mới',
                    content: 'Chúng tôi vừa cập nhật tính năng quản lý POI mới. Vui lòng kiểm tra!',
                    sentAt: '2026-03-15T14:30:00',
                    recipients: 203,
                  },
                  {
                    title: 'Thông báo chính sách mới',
                    content: 'Chính sách kiểm duyệt nội dung đã được cập nhật.',
                    sentAt: '2026-03-10T09:00:00',
                    recipients: 189,
                  },
                ].map((broadcast, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border p-4"
                  >
                    <div className="rounded-full bg-muted p-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{broadcast.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(broadcast.sentAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {broadcast.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Đã gửi đến {broadcast.recipients} người dùng
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
