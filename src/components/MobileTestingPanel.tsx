import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useResponsive } from '@/hooks/useResponsive';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  Battery, 
  Signal,
  Eye,
  TouchpadIcon as Touch
} from 'lucide-react';

const MobileTestingPanel: React.FC = () => {
  const { screenSize, currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsive();
  const [showTestPanel, setShowTestPanel] = useState(false);

  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
  };

  const getDeviceType = () => {
    if (isMobile) return { icon: Smartphone, label: 'Mobile', color: 'bg-blue-500' };
    if (isTablet) return { icon: Tablet, label: 'Tablet', color: 'bg-green-500' };
    if (isDesktop) return { icon: Monitor, label: 'Desktop', color: 'bg-purple-500' };
    return { icon: Monitor, label: 'Unknown', color: 'bg-gray-500' };
  };

  const device = getDeviceType();
  const DeviceIcon = device.icon;

  if (!showTestPanel) {
    return (
      <div className="fixed bottom-4 right-4 z-50 lg:bottom-8 lg:right-8">
        <Button
          onClick={() => setShowTestPanel(true)}
          size="sm"
          className="rounded-full w-12 h-12 shadow-lg bg-orange-500 hover:bg-orange-600"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Device Testing Panel</CardTitle>
            <Button
              onClick={() => setShowTestPanel(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Device Type */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${device.color} text-white`}>
              <DeviceIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{device.label}</p>
              <p className="text-sm text-gray-500">Current device type</p>
            </div>
          </div>

          {/* Screen Information */}
          <div className="space-y-2">
            <h3 className="font-medium">Screen Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Width:</span>
                <span className="ml-2 font-mono">{screenSize.width}px</span>
              </div>
              <div>
                <span className="text-gray-500">Height:</span>
                <span className="ml-2 font-mono">{screenSize.height}px</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Breakpoint:</span>
                <Badge variant="outline" className="ml-2">
                  {currentBreakpoint}
                </Badge>
              </div>
            </div>
          </div>

          {/* Device Capabilities */}
          <div className="space-y-2">
            <h3 className="font-medium">Device Status</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant={deviceInfo.onLine ? "default" : "destructive"}>
                <Wifi className="h-3 w-3 mr-1" />
                {deviceInfo.onLine ? 'Online' : 'Offline'}
              </Badge>
              <Badge variant="outline">
                <Touch className="h-3 w-3 mr-1" />
                Touch: {('ontouchstart' in window) ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>

          {/* Responsive Features Test */}
          <div className="space-y-2">
            <h3 className="font-medium">Responsive Features</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Mobile Navigation:</span>
                <Badge variant={isMobile ? "default" : "secondary"}>
                  {isMobile ? 'Active' : 'Hidden'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Sidebar:</span>
                <Badge variant={isDesktop ? "default" : "secondary"}>
                  {isDesktop ? 'Visible' : 'Hidden'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Bottom Nav:</span>
                <Badge variant={isMobile ? "default" : "secondary"}>
                  {isMobile ? 'Visible' : 'Hidden'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Touch Target Test */}
          <div className="space-y-2">
            <h3 className="font-medium">Touch Target Test</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="h-12 touch-target">
                48px Target
              </Button>
              <Button size="sm" className="h-8">
                32px Target
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Left button meets 48px minimum touch target
            </p>
          </div>

          {/* Platform Information */}
          <div className="space-y-2">
            <h3 className="font-medium">Platform</h3>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-gray-500">OS:</span>
                <span className="ml-2">{deviceInfo.platform}</span>
              </div>
              <div>
                <span className="text-gray-500">Language:</span>
                <span className="ml-2">{deviceInfo.language}</span>
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="space-y-2">
            <h3 className="font-medium">Test Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  if (navigator.vibrate) {
                    navigator.vibrate(100);
                  }
                }}
              >
                Test Vibration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileTestingPanel;