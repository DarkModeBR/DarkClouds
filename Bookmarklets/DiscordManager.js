(async () => {
    if (!window.location.hostname.includes("discord.com") || document.getElementById("discord-friend-manager")) return;

    const getToken = () => {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);
        const token = iframe.contentWindow.localStorage.getItem("token")?.replace(/"/g, "");
        document.body.removeChild(iframe);
        return token;
    };

    const getCurrentUserId = () => {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);
        const id = iframe.contentWindow.localStorage.getItem("user_id_cache")?.replace(/"/g, "");
        document.body.removeChild(iframe);
        return id;
    };

    const token = getToken();
    const xSuperProperties = "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6InB0LUJSIiwiaGFzX2NsaWVudF9tb2RzIjpmYWxzZSwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMC4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTIwLjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiIiLCJyZWZlcnJpbmdfZG9tYWluIjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6OTk5OTk5LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==";

    const delays = { fast: 100, normal: 500, slow: 1000 };
    let requestDelay = delays.normal;
    let requestSpeed = "normal";

    const notificationQueue = [];
    let activeNotifications = 0;
    let isManagerOpen = false;
    let isAnimating = false;
    let isDragging = false;
    let offsetX, offsetY;

    const style = document.createElement("style");
    style.textContent = `
        @keyframes slideInRight { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
        @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes dots { 0%, 20% { content: '.'; } 40% { content: '..'; } 60%, 100% { content: '...'; } }

        #discord-friend-manager, #discord-friend-manager *, #discord-friend-manager *::before, #discord-friend-manager *::after,
        .dfm-modal, .dfm-modal *, .dfm-settings-modal, .dfm-settings-modal *, #dfm-notification-container, #dfm-notification-container * {
            box-sizing: border-box !important;
            font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        }

        #discord-friend-manager {
            position: fixed !important; display: none !important; width: 700px !important; max-width: calc(100vw - 40px) !important;
            height: 600px !important; max-height: calc(100vh - 40px) !important;
            background: linear-gradient(145deg, #0f0f0f 0%, #1a1a1a 100%) !important; border-radius: 12px !important;
            z-index: 999999 !important; flex-direction: column !important; overflow: hidden !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        #discord-friend-manager.visible { display: flex !important; animation: fadeIn 0.25s ease forwards !important; }
        #discord-friend-manager.closing { display: flex !important; animation: fadeOut 0.25s ease forwards !important; }

        .dfm-header {
            background: linear-gradient(135deg, #1a1a1a 0%, #141414 100%) !important; padding: 16px 20px !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important; display: flex !important;
            justify-content: center !important; align-items: center !important; cursor: move !important;
            user-select: none !important; position: relative !important; flex-shrink: 0 !important; min-height: 56px !important;
        }
        .dfm-header::before {
            content: '' !important; position: absolute !important; top: 0 !important; left: 0 !important;
            width: 100% !important; height: 100% !important;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent) !important;
            background-size: 200% 100% !important; animation: shimmer 3s ease-in-out infinite !important; pointer-events: none !important;
        }
        .dfm-title { color: #ffffff !important; font-size: 16px !important; font-weight: 700 !important; letter-spacing: -0.3px !important; text-align: center !important; margin: 0 !important; padding: 0 !important; }
        .dfm-controls { position: absolute !important; right: 16px !important; top: 50% !important; transform: translateY(-50%) !important; display: flex !important; gap: 8px !important; }

        .dfm-btn-icon {
            background: rgba(255, 255, 255, 0.06) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #b0b0b0 !important; cursor: pointer !important; width: 32px !important; height: 32px !important;
            min-width: 32px !important; min-height: 32px !important; border-radius: 6px !important;
            transition: all 0.15s ease !important; font-size: 16px !important; display: flex !important;
            align-items: center !important; justify-content: center !important; padding: 0 !important; margin: 0 !important;
        }
        .dfm-btn-icon:hover { background: rgba(255, 255, 255, 0.1) !important; color: #ffffff !important; border-color: rgba(255, 255, 255, 0.15) !important; }
        .dfm-btn-icon:active { transform: scale(0.92) !important; opacity: 0.8 !important; }

        .dfm-tabs { display: flex !important; background: #141414 !important; border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important; flex-shrink: 0 !important; padding: 0 !important; margin: 0 !important; }
        .dfm-tab {
            flex: 1 !important; padding: 14px 20px !important; background: transparent !important; border: none !important;
            color: #888888 !important; font-size: 14px !important; font-weight: 600 !important; cursor: pointer !important;
            transition: all 0.2s ease !important; text-align: center !important; position: relative !important; margin: 0 !important;
        }
        .dfm-tab::after {
            content: '' !important; position: absolute !important; bottom: 0 !important; left: 50% !important;
            width: 0 !important; height: 2px !important; background: #5865f2 !important;
            transition: all 0.2s ease !important; transform: translateX(-50%) !important;
        }
        .dfm-tab:hover { color: #cccccc !important; background: rgba(255, 255, 255, 0.03) !important; }
        .dfm-tab.active { color: #5865f2 !important; background: rgba(88, 101, 242, 0.08) !important; }
        .dfm-tab.active::after { width: 100% !important; left: 0 !important; transform: translateX(0) !important; }

        .dfm-content {
            flex: 1 !important; overflow-y: auto !important; overflow-x: hidden !important; background: #0f0f0f !important;
            scrollbar-width: thin !important; scrollbar-color: rgba(255, 255, 255, 0.15) transparent !important;
        }
        .dfm-content::-webkit-scrollbar { width: 8px !important; }
        .dfm-content::-webkit-scrollbar-track { background: transparent !important; }
        .dfm-content::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15) !important; border-radius: 4px !important; }
        .dfm-content::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25) !important; }

        .dfm-tab-content { display: none !important; padding: 20px !important; }
        .dfm-tab-content.active { display: block !important; }

        .dfm-search-container { margin-bottom: 16px !important; }
        .dfm-search {
            width: 100% !important; padding: 12px 16px !important; background: rgba(255, 255, 255, 0.06) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 8px !important;
            color: #ffffff !important; font-size: 14px !important; transition: all 0.2s ease !important; outline: none !important;
        }
        .dfm-search::placeholder { color: #666666 !important; }
        .dfm-search:focus { border-color: #5865f2 !important; background: rgba(88, 101, 242, 0.1) !important; }

        .dfm-actions { display: flex !important; gap: 10px !important; margin-bottom: 16px !important; flex-wrap: wrap !important; }
        .dfm-actions .dfm-btn { flex: 1 !important; min-width: 140px !important; }

        .dfm-btn {
            background: linear-gradient(135deg, #5865f2 0%, #4752c4 100%) !important; color: #ffffff !important;
            border: none !important; padding: 12px 20px !important; border-radius: 8px !important;
            font-size: 14px !important; font-weight: 600 !important; cursor: pointer !important;
            transition: all 0.15s ease !important; text-align: center !important; white-space: nowrap !important; margin: 0 !important;
        }
        .dfm-btn:hover { filter: brightness(1.1) !important; transform: translateY(-1px) !important; }
        .dfm-btn:active { transform: translateY(0) !important; }
        .dfm-btn.secondary { background: linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; }
        .dfm-btn.secondary:hover { background: linear-gradient(135deg, #444444 0%, #333333 100%) !important; }
        .dfm-btn.danger { background: linear-gradient(135deg, #ed4245 0%, #c03537 100%) !important; }
        .dfm-btn.danger:hover { filter: brightness(1.1) !important; }
        .dfm-btn.warning { background: linear-gradient(135deg, #faa61a 0%, #d68a15 100%) !important; }
        .dfm-btn.warning:hover { filter: brightness(1.1) !important; }
        .dfm-btn:disabled { opacity: 0.5 !important; cursor: not-allowed !important; transform: none !important; pointer-events: none !important; }

        .dfm-friend, .dfm-server {
            background: rgba(255, 255, 255, 0.04) !important; padding: 12px 16px !important; border-radius: 8px !important;
            margin-bottom: 8px !important; display: flex !important; align-items: center !important; gap: 12px !important;
            transition: all 0.15s ease !important; border: 1px solid rgba(255, 255, 255, 0.06) !important;
        }
        .dfm-friend:hover, .dfm-server:hover { background: rgba(255, 255, 255, 0.08) !important; border-color: rgba(255, 255, 255, 0.1) !important; }
        .dfm-friend.selected, .dfm-server.selected { background: rgba(88, 101, 242, 0.15) !important; border-color: rgba(88, 101, 242, 0.4) !important; }

        .dfm-checkbox { width: 18px !important; height: 18px !important; min-width: 18px !important; min-height: 18px !important; cursor: pointer !important; accent-color: #5865f2 !important; flex-shrink: 0 !important; margin: 0 !important; }

        .dfm-avatar, .dfm-server-icon {
            width: 40px !important; height: 40px !important; min-width: 40px !important; min-height: 40px !important;
            border-radius: 50% !important; flex-shrink: 0 !important; border: 2px solid rgba(255, 255, 255, 0.1) !important; object-fit: cover !important;
        }

        .dfm-info { flex: 1 !important; min-width: 0 !important; display: flex !important; flex-direction: column !important; justify-content: center !important; }
        .dfm-name { color: #ffffff !important; font-size: 14px !important; font-weight: 600 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; margin: 0 !important; padding: 0 !important; }

        .dfm-friend-actions, .dfm-server-actions { display: flex !important; gap: 8px !important; flex-shrink: 0 !important; }

        .dfm-remove, .dfm-delete-messages, .dfm-leave-server {
            border: none !important; padding: 8px 16px !important; border-radius: 6px !important;
            font-size: 13px !important; font-weight: 600 !important; cursor: pointer !important;
            transition: all 0.15s ease !important; color: #ffffff !important; white-space: nowrap !important; margin: 0 !important;
        }
        .dfm-remove { background: linear-gradient(135deg, #ed4245 0%, #c03537 100%) !important; }
        .dfm-delete-messages { background: linear-gradient(135deg, #faa61a 0%, #d68a15 100%) !important; }
        .dfm-leave-server { background: linear-gradient(135deg, #ed4245 0%, #c03537 100%) !important; }
        .dfm-remove:hover, .dfm-delete-messages:hover, .dfm-leave-server:hover { filter: brightness(1.1) !important; transform: translateY(-1px) !important; }
        .dfm-remove:active, .dfm-delete-messages:active, .dfm-leave-server:active { transform: translateY(0) !important; }
        .dfm-remove:disabled, .dfm-delete-messages:disabled, .dfm-leave-server:disabled { opacity: 0.5 !important; cursor: not-allowed !important; transform: none !important; }

        .dfm-loading { text-align: center !important; color: #888888 !important; padding: 60px 20px !important; font-size: 14px !important; font-weight: 500 !important; }
        .dfm-loading::after { content: '...' !important; animation: dots 1.5s steps(4, end) infinite !important; }
        .dfm-empty { text-align: center !important; color: #666666 !important; padding: 60px 20px !important; font-size: 14px !important; font-weight: 500 !important; }

        .dfm-modal {
            position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important;
            background: rgba(0, 0, 0, 0.8) !important; display: flex !important; align-items: center !important;
            justify-content: center !important; z-index: 1000000 !important; padding: 20px !important; backdrop-filter: blur(4px) !important;
        }
        .dfm-modal-content {
            background: linear-gradient(145deg, #1a1a1a 0%, #141414 100%) !important; padding: 24px !important;
            border-radius: 12px !important; max-width: 420px !important; width: 100% !important;
            animation: modalFadeIn 0.2s ease !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .dfm-modal-title { color: #ffffff !important; font-size: 18px !important; font-weight: 700 !important; margin: 0 0 12px 0 !important; padding: 0 !important; text-align: center !important; }
        .dfm-modal-text { color: #b0b0b0 !important; font-size: 14px !important; margin: 0 0 20px 0 !important; padding: 0 !important; text-align: center !important; line-height: 1.5 !important; }
        .dfm-modal-actions { display: flex !important; gap: 10px !important; justify-content: center !important; }
        .dfm-modal-actions .dfm-btn { flex: 1 !important; max-width: 150px !important; }

        .dfm-progress-container { background: rgba(255, 255, 255, 0.05) !important; border-radius: 8px !important; padding: 16px !important; margin-top: 12px !important; }
        .dfm-progress-text { color: #ffffff !important; font-size: 14px !important; font-weight: 600 !important; margin: 0 0 10px 0 !important; padding: 0 !important; text-align: center !important; }
        .dfm-progress-bar-container { background: rgba(0, 0, 0, 0.3) !important; border-radius: 4px !important; height: 6px !important; overflow: hidden !important; }
        .dfm-progress-bar { background: linear-gradient(90deg, #5865f2, #4752c4) !important; height: 100% !important; border-radius: 4px !important; transition: width 0.3s ease !important; width: 0 !important; }

        #dfm-notification-container {
            position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 9999999 !important;
            display: flex !important; flex-direction: column !important; gap: 10px !important;
            pointer-events: none !important; max-width: 360px !important;
        }
        .dfm-notification {
            background: linear-gradient(135deg, #1a1a1a 0%, #141414 100%) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 8px !important;
            padding: 14px 16px !important; min-width: 300px !important; animation: slideInRight 0.3s ease !important;
            pointer-events: all !important; display: flex !important; align-items: center !important;
            gap: 12px !important; position: relative !important; overflow: hidden !important;
        }
        .dfm-notification::before { content: '' !important; position: absolute !important; left: 0 !important; top: 0 !important; height: 100% !important; width: 4px !important; background: var(--notification-color) !important; }
        .dfm-notification.removing { animation: slideOutRight 0.25s ease forwards !important; }
        .dfm-notification.success { --notification-color: #43b581 !important; }
        .dfm-notification.error { --notification-color: #ed4245 !important; }
        .dfm-notification.warning { --notification-color: #faa61a !important; }
        .dfm-notification.info { --notification-color: #5865f2 !important; }
        .dfm-notification.friend-removed, .dfm-notification.server-left, .dfm-notification.server-muted { --notification-color: #ed4245 !important; }
        .dfm-notification.server-muted { --notification-color: #43b581 !important; }

        .dfm-notification-icon { font-size: 20px !important; flex-shrink: 0 !important; }
        .dfm-notification.success .dfm-notification-icon { color: #43b581 !important; }
        .dfm-notification.error .dfm-notification-icon { color: #ed4245 !important; }
        .dfm-notification.warning .dfm-notification-icon { color: #faa61a !important; }
        .dfm-notification.info .dfm-notification-icon { color: #5865f2 !important; }

        .dfm-notification-content { flex: 1 !important; min-width: 0 !important; }
        .dfm-notification-title { color: #ffffff !important; font-size: 14px !important; font-weight: 600 !important; margin: 0 0 2px 0 !important; padding: 0 !important; line-height: 1.3 !important; }
        .dfm-notification-message { color: #b0b0b0 !important; font-size: 13px !important; line-height: 1.4 !important; word-wrap: break-word !important; margin: 0 !important; padding: 0 !important; }

        .dfm-notification-close {
            background: rgba(255, 255, 255, 0.08) !important; border: none !important; color: #888888 !important;
            cursor: pointer !important; width: 24px !important; height: 24px !important; min-width: 24px !important;
            min-height: 24px !important; border-radius: 4px !important; transition: all 0.15s ease !important;
            font-size: 14px !important; display: flex !important; align-items: center !important;
            justify-content: center !important; flex-shrink: 0 !important; padding: 0 !important; margin: 0 !important;
        }
        .dfm-notification-close:hover { background: rgba(255, 255, 255, 0.15) !important; color: #ffffff !important; }

        .dfm-friend-removed-content, .dfm-server-left-content { display: flex !important; align-items: center !important; gap: 10px !important; width: 100% !important; }
        .dfm-friend-removed-avatar, .dfm-server-left-icon {
            width: 36px !important; height: 36px !important; min-width: 36px !important; min-height: 36px !important;
            border-radius: 50% !important; border: 2px solid rgba(237, 66, 69, 0.3) !important; flex-shrink: 0 !important; object-fit: cover !important;
        }
        .dfm-server-left-icon { border-radius: 8px !important; }
        .dfm-friend-removed-info, .dfm-server-left-info { flex: 1 !important; min-width: 0 !important; }
        .dfm-friend-removed-name, .dfm-server-left-name {
            color: #ffffff !important; font-size: 14px !important; font-weight: 600 !important;
            margin: 0 0 2px 0 !important; padding: 0 !important; white-space: nowrap !important;
            overflow: hidden !important; text-overflow: ellipsis !important;
        }
        .dfm-friend-removed-text, .dfm-server-left-text { color: #888888 !important; font-size: 12px !important; margin: 0 !important; padding: 0 !important; }

        .dfm-settings-modal {
            position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important;
            background: rgba(0, 0, 0, 0.8) !important; display: flex !important; align-items: center !important;
            justify-content: center !important; z-index: 1000001 !important; padding: 20px !important; backdrop-filter: blur(4px) !important;
        }
        .dfm-settings-content {
            background: linear-gradient(145deg, #1a1a1a 0%, #141414 100%) !important; padding: 24px !important;
            border-radius: 12px !important; max-width: 380px !important; width: 100% !important;
            animation: modalFadeIn 0.2s ease !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .dfm-settings-title { color: #ffffff !important; font-size: 18px !important; font-weight: 700 !important; margin: 0 0 20px 0 !important; padding: 0 !important; text-align: center !important; }

        .dfm-settings-option { margin: 0 0 20px 0 !important; }
        .dfm-settings-label { color: #b0b0b0 !important; font-size: 14px !important; margin: 0 0 8px 0 !important; padding: 0 !important; display: block !important; font-weight: 500 !important; }
        .dfm-settings-select {
            width: 100% !important; padding: 12px 40px 12px 14px !important; background: rgba(255, 255, 255, 0.06) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 8px !important;
            color: #ffffff !important; font-size: 14px !important; cursor: pointer !important; appearance: none !important;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e") !important;
            background-repeat: no-repeat !important; background-position: right 12px center !important;
            background-size: 20px !important; transition: all 0.15s ease !important; outline: none !important; margin: 0 !important;
        }
        .dfm-settings-select:focus { border-color: #5865f2 !important; background-color: rgba(88, 101, 242, 0.1) !important; }
        .dfm-settings-select option { background: #1a1a1a !important; color: #ffffff !important; padding: 10px !important; }

        .dfm-advanced-section {
            background: rgba(255, 255, 255, 0.03) !important; border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 10px !important; padding: 20px !important; margin-bottom: 16px !important;
        }
        .dfm-section-header { display: flex !important; align-items: center !important; gap: 10px !important; margin-bottom: 8px !important; }
        .dfm-section-title { color: #ffffff !important; font-size: 16px !important; font-weight: 600 !important; margin: 0 0 8px 0 !important; }
        .dfm-section-header .dfm-section-title { margin: 0 !important; }
        .dfm-section-description { color: #888888 !important; font-size: 13px !important; line-height: 1.5 !important; margin: 0 0 16px 0 !important; }

        .dfm-input-group { display: flex !important; gap: 10px !important; }
        .dfm-input {
            flex: 1 !important; padding: 12px 16px !important; background: rgba(255, 255, 255, 0.06) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 8px !important;
            color: #ffffff !important; font-size: 14px !important; transition: all 0.2s ease !important; outline: none !important;
        }
        .dfm-input::placeholder { color: #666666 !important; }
        .dfm-input:focus { border-color: #5865f2 !important; background: rgba(88, 101, 242, 0.1) !important; }

        .dfm-progress-actions { display: flex !important; justify-content: center !important; margin-top: 16px !important; }
        .dfm-btn-cancel {
            background: linear-gradient(135deg, #72767d 0%, #5d6169 100%) !important; color: #ffffff !important;
            border: none !important; padding: 10px 24px !important; border-radius: 8px !important;
            font-size: 14px !important; font-weight: 600 !important; cursor: pointer !important; transition: all 0.15s ease !important;
        }
        .dfm-btn-cancel:hover { filter: brightness(1.1) !important; transform: translateY(-1px) !important; }
        .dfm-btn-cancel:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }
    `;
    document.head.appendChild(style);

    const notificationContainer = document.createElement("div");
    notificationContainer.id = "dfm-notification-container";
    document.body.appendChild(notificationContainer);

    const showNotification = (message, type = "info", title = "", iconUrl = "", name = "") => {
        const notification = { message, type, title, iconUrl, name, id: Date.now() + Math.random() };
        if (activeNotifications >= 3) {
            notificationQueue.push(notification);
            return;
        }
        displayNotification(notification);
    };

    const displayNotification = notification => {
        activeNotifications++;
        const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
        const notifElement = document.createElement("div");
        notifElement.className = `dfm-notification ${notification.type}`;
        notifElement.dataset.id = notification.id;

        if ((notification.type === "friend-removed" || notification.type === "server-left") && notification.iconUrl && notification.name) {
            const isServerLeft = notification.type === "server-left";
            notifElement.classList.add(isServerLeft ? "server-left" : "friend-removed");
            notifElement.innerHTML = `
                <div class="${isServerLeft ? "dfm-server-left-content" : "dfm-friend-removed-content"}">
                    <img class="${isServerLeft ? "dfm-server-left-icon" : "dfm-friend-removed-avatar"}" src="${notification.iconUrl}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                    <div class="${isServerLeft ? "dfm-server-left-info" : "dfm-friend-removed-info"}">
                        <div class="${isServerLeft ? "dfm-server-left-name" : "dfm-friend-removed-name"}">${notification.name}</div>
                        <div class="${isServerLeft ? "dfm-server-left-text" : "dfm-friend-removed-text"}">${isServerLeft ? "Servidor abandonado" : "Amigo removido"}</div>
                    </div>
                    <button class="dfm-notification-close">×</button>
                </div>
            `;
        } else {
            notifElement.innerHTML = `
                <div class="dfm-notification-icon">${icons[notification.type] || icons.info}</div>
                <div class="dfm-notification-content">
                    ${notification.title ? `<div class="dfm-notification-title">${notification.title}</div>` : ""}
                    <div class="dfm-notification-message">${notification.message}</div>
                </div>
                <button class="dfm-notification-close">×</button>
            `;
        }

        notificationContainer.appendChild(notifElement);
        notifElement.querySelector(".dfm-notification-close").addEventListener("click", () => removeNotification(notifElement));
        setTimeout(() => notifElement.parentElement && removeNotification(notifElement), 5000);
    };

    const removeNotification = notifElement => {
        notifElement.classList.add("removing");
        setTimeout(() => {
            notifElement.remove();
            activeNotifications--;
            if (notificationQueue.length > 0) displayNotification(notificationQueue.shift());
        }, 300);
    };

    const showConfirmModal = (message, onConfirm) => {
        const modal = document.createElement("div");
        modal.className = "dfm-modal";
        modal.innerHTML = `
            <div class="dfm-modal-content">
                <div class="dfm-modal-title">Confirmação</div>
                <div class="dfm-modal-text">${message}</div>
                <div class="dfm-modal-actions">
                    <button class="dfm-btn secondary" id="cancel">Cancelar</button>
                    <button class="dfm-btn danger" id="confirm">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector("#cancel").onclick = () => modal.remove();
        modal.querySelector("#confirm").onclick = () => { modal.remove(); onConfirm(); };
        modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    };

    const createProgressModal = (title, total, showCancel = true) => {
        const state = { cancelled: false };
        const modal = document.createElement("div");
        modal.className = "dfm-modal";
        modal.innerHTML = `
            <div class="dfm-modal-content">
                <div class="dfm-modal-title">${title}</div>
                <div class="dfm-progress-container">
                    <div class="dfm-progress-text" id="progress-text">0/${total}</div>
                    <div class="dfm-progress-bar-container">
                        <div class="dfm-progress-bar" id="progress-bar"></div>
                    </div>
                </div>
                ${showCancel ? '<div class="dfm-progress-actions"><button class="dfm-btn-cancel" id="cancel-operation">Cancelar</button></div>' : ""}
            </div>
        `;
        if (showCancel) {
            modal.querySelector("#cancel-operation").addEventListener("click", () => {
                state.cancelled = true;
                modal.querySelector("#cancel-operation").disabled = true;
                modal.querySelector("#cancel-operation").textContent = "Cancelando...";
                modal.querySelector("#progress-text").textContent = "Cancelando operação...";
            });
        }
        return { modal, state };
    };

    const updateProgress = (textElement, barElement, current, total, action) => {
        const percent = (current / total) * 100;
        textElement.textContent = `${action} ${current}/${total}`;
        barElement.style.width = `${percent}%`;
    };

    const showSettingsModal = () => {
        const modal = document.createElement("div");
        modal.className = "dfm-settings-modal";
        modal.innerHTML = `
            <div class="dfm-settings-content">
                <div class="dfm-settings-title">Configurações</div>
                <div class="dfm-settings-option">
                    <label class="dfm-settings-label">Velocidade das requisições:</label>
                    <select class="dfm-settings-select" id="request-speed">
                        <option value="fast" ${requestSpeed === "fast" ? "selected" : ""}>Rápida (100ms)</option>
                        <option value="normal" ${requestSpeed === "normal" ? "selected" : ""}>Normal (500ms)</option>
                        <option value="slow" ${requestSpeed === "slow" ? "selected" : ""}>Lenta (1000ms)</option>
                    </select>
                </div>
                <div class="dfm-modal-actions">
                    <button class="dfm-btn secondary" id="settings-cancel">Cancelar</button>
                    <button class="dfm-btn" id="settings-save">Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector("#settings-cancel").onclick = () => modal.remove();
        modal.querySelector("#settings-save").onclick = () => {
            requestSpeed = modal.querySelector("#request-speed").value;
            requestDelay = delays[requestSpeed];
            modal.remove();
            showNotification("Configurações salvas!", "success");
        };
        modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    };

    const apiRequest = async (url, options = {}) => {
        const defaultHeaders = { authorization: token, "x-super-properties": xSuperProperties };
        options.headers = { ...defaultHeaders, ...options.headers };
        const response = await fetch(url, options);
        return response;
    };

    const fetchFriends = async () => (await apiRequest("https://discord.com/api/v9/users/@me/relationships")).json();
    const fetchServers = async () => (await apiRequest("https://discord.com/api/v9/users/@me/guilds")).json();

    const removeFriend = async (userId, userName, avatarUrl) => {
        await apiRequest(`https://discord.com/api/v9/users/@me/relationships/${userId}`, { method: "DELETE" });
        showNotification("", "friend-removed", "", avatarUrl, userName);
        await new Promise(r => setTimeout(r, requestDelay));
    };

    const leaveServer = async (serverId, serverName, iconUrl) => {
        await apiRequest(`https://discord.com/api/v9/users/@me/guilds/${serverId}`, {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ lurking: false })
        });
        showNotification("", "server-left", "", iconUrl, serverName);
        await new Promise(r => setTimeout(r, requestDelay));
    };

    const muteServer = async serverId => {
        await apiRequest("https://discord.com/api/v9/users/@me/guilds/settings", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ guilds: { [serverId]: { muted: true } } })
        });
        await new Promise(r => setTimeout(r, requestDelay));
    };

    const muteAllServers = async () => {
        const servers = await fetchServers();
        if (!servers.length) {
            showNotification("Nenhum servidor encontrado!", "warning");
            return;
        }

        showConfirmModal(`Tem certeza que deseja SILENCIAR todos os ${servers.length} servidores?`, async () => {
            const { modal: progressModal, state: cancelState } = createProgressModal("Silenciando Servidores", servers.length);
            document.body.appendChild(progressModal);

            const progressText = progressModal.querySelector("#progress-text");
            const progressBar = progressModal.querySelector("#progress-bar");
            let mutedCount = 0;

            for (let i = 0; i < servers.length; i++) {
                if (cancelState.cancelled) break;
                const server = servers[i];
                try {
                    await muteServer(server.id);
                    mutedCount++;
                } catch {}
                updateProgress(progressText, progressBar, i + 1, servers.length, "Silenciando");
            }

            progressModal.remove();
            if (cancelState.cancelled) {
                showNotification(`Cancelado! ${mutedCount} servidores silenciados.`, "warning");
            } else {
                showNotification(`${mutedCount} servidores silenciados!`, "success");
            }
        });
    };

    const getChannelId = async userId => {
        const response = await apiRequest("https://discord.com/api/v9/users/@me/channels", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ recipients: [userId] })
        });
        const data = await response.json();
        return data.id;
    };

    const fetchMessages = async (channelId, before = null) => {
        let url = `https://discord.com/api/v9/channels/${channelId}/messages?limit=100`;
        if (before) url += `&before=${before}`;
        while (true) {
            try {
                const response = await apiRequest(url);
                if (response.ok) return response.json();
                await new Promise(r => setTimeout(r, 10000));
            } catch {
                await new Promise(r => setTimeout(r, 10000));
            }
        }
    };

    const deleteMessage = async (channelId, messageId) => {
        let errorCount = 0;
        while (true) {
            try {
                const response = await apiRequest(`https://discord.com/api/v9/channels/${channelId}/messages/${messageId}`, { method: "DELETE" });
                if (response.ok) return true;
                if (response.status === 50021) return false;
                errorCount++;
                if (errorCount >= 3) return false;
                await new Promise(r => setTimeout(r, 10000));
            } catch {
                errorCount++;
                if (errorCount >= 3) return false;
                await new Promise(r => setTimeout(r, 10000));
            }
        }
    };

    const deleteAllMessages = async (userId, userName) => {
        showConfirmModal(`Tem certeza que deseja apagar TODAS as suas mensagens com ${userName}?<br><br>Essa ação não pode ser desfeita!`, async () => {
            const cancelState = { cancelled: false };
            const progressModal = document.createElement("div");
            progressModal.className = "dfm-modal";
            progressModal.innerHTML = `
                <div class="dfm-modal-content">
                    <div class="dfm-modal-title">Apagando Mensagens</div>
                    <div class="dfm-progress-container">
                        <div class="dfm-progress-text" id="progress-text">Escaneando mensagens...</div>
                        <div class="dfm-progress-bar-container">
                            <div class="dfm-progress-bar" id="progress-bar"></div>
                        </div>
                    </div>
                    <div class="dfm-progress-actions">
                        <button class="dfm-btn-cancel" id="cancel-operation">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(progressModal);

            const progressText = progressModal.querySelector("#progress-text");
            const progressBar = progressModal.querySelector("#progress-bar");
            const cancelBtn = progressModal.querySelector("#cancel-operation");
            cancelBtn.addEventListener("click", () => {
                cancelState.cancelled = true;
                cancelBtn.disabled = true;
                cancelBtn.textContent = "Cancelando...";
            });

            const currentUserId = getCurrentUserId();
            const channelId = await getChannelId(userId);
            const messageIds = [];
            let lastMessageId = null;

            while (true) {
                if (cancelState.cancelled) break;
                const messages = await fetchMessages(channelId, lastMessageId);
                if (!messages.length) break;
                for (const msg of messages) {
                    if (msg.author.id === currentUserId) messageIds.push(msg.id);
                    lastMessageId = msg.id;
                }
                progressText.textContent = `${messageIds.length} mensagens encontradas...`;
            }

            if (cancelState.cancelled) {
                progressModal.remove();
                showNotification("Operação cancelada!", "warning");
                return;
            }

            if (!messageIds.length) {
                progressModal.remove();
                showNotification("Nenhuma mensagem encontrada", "info");
                return;
            }

            let deletedCount = 0;
            for (let i = 0; i < messageIds.length; i++) {
                if (cancelState.cancelled) break;
                if (await deleteMessage(channelId, messageIds[i])) deletedCount++;
                const percent = ((i + 1) / messageIds.length) * 100;
                progressText.textContent = `Apagando ${deletedCount}/${messageIds.length} mensagens`;
                progressBar.style.width = `${percent}%`;
                await new Promise(r => setTimeout(r, requestDelay));
            }

            progressModal.remove();
            if (cancelState.cancelled) {
                showNotification(`Cancelado! ${deletedCount} mensagens foram apagadas.`, "warning");
            } else {
                showNotification(`${deletedCount} mensagens apagadas!`, "success");
            }
        });
    };

    const deleteMessagesByUserId = async userId => {
        if (!userId?.trim()) {
            showNotification("Digite um ID de usuário válido!", "warning");
            return;
        }

        showConfirmModal(`Tem certeza que deseja apagar TODAS as suas mensagens com o usuário ID: ${userId}?<br><br>Essa ação não pode ser desfeita!`, async () => {
            const cancelState = { cancelled: false };
            const progressModal = document.createElement("div");
            progressModal.className = "dfm-modal";
            progressModal.innerHTML = `
                <div class="dfm-modal-content">
                    <div class="dfm-modal-title">Apagando Mensagens</div>
                    <div class="dfm-progress-container">
                        <div class="dfm-progress-text" id="progress-text">Obtendo canal...</div>
                        <div class="dfm-progress-bar-container">
                            <div class="dfm-progress-bar" id="progress-bar"></div>
                        </div>
                    </div>
                    <div class="dfm-progress-actions">
                        <button class="dfm-btn-cancel" id="cancel-operation">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(progressModal);

            const progressText = progressModal.querySelector("#progress-text");
            const progressBar = progressModal.querySelector("#progress-bar");
            const cancelBtn = progressModal.querySelector("#cancel-operation");
            cancelBtn.addEventListener("click", () => {
                cancelState.cancelled = true;
                cancelBtn.disabled = true;
                cancelBtn.textContent = "Cancelando...";
            });

            try {
                const currentUserId = getCurrentUserId();
                const channelId = await getChannelId(userId.trim());

                if (!channelId) {
                    progressModal.remove();
                    showNotification("Não foi possível encontrar a conversa com este usuário", "error");
                    return;
                }

                progressText.textContent = "Escaneando mensagens...";
                const messageIds = [];
                let lastMessageId = null;

                while (true) {
                    if (cancelState.cancelled) break;
                    const messages = await fetchMessages(channelId, lastMessageId);
                    if (!messages.length) break;
                    for (const msg of messages) {
                        if (msg.author.id === currentUserId) messageIds.push(msg.id);
                        lastMessageId = msg.id;
                    }
                    progressText.textContent = `${messageIds.length} mensagens encontradas...`;
                }

                if (cancelState.cancelled) {
                    progressModal.remove();
                    showNotification("Operação cancelada!", "warning");
                    return;
                }

                if (!messageIds.length) {
                    progressModal.remove();
                    showNotification("Nenhuma mensagem sua encontrada nesta conversa", "info");
                    return;
                }

                let deletedCount = 0;
                for (let i = 0; i < messageIds.length; i++) {
                    if (cancelState.cancelled) break;
                    if (await deleteMessage(channelId, messageIds[i])) deletedCount++;
                    const percent = ((i + 1) / messageIds.length) * 100;
                    progressText.textContent = `Apagando ${deletedCount}/${messageIds.length} mensagens`;
                    progressBar.style.width = `${percent}%`;
                    await new Promise(r => setTimeout(r, requestDelay));
                }

                progressModal.remove();
                if (cancelState.cancelled) {
                    showNotification(`Cancelado! ${deletedCount} mensagens foram apagadas.`, "warning");
                } else {
                    showNotification(`${deletedCount} mensagens apagadas!`, "success");
                }
            } catch {
                progressModal.remove();
                showNotification("Erro ao deletar mensagens", "error");
            }
        });
    };

    const closeAllDMs = async () => {
        const initialButtons = document.querySelectorAll('[aria-label="Fechar mensagem direta"]');
        if (!initialButtons.length) {
            showNotification("Nenhuma DM aberta encontrada!", "warning");
            return;
        }

        showConfirmModal(`Tem certeza que deseja FECHAR todas as DMs abertas?<br><br>Isso não apaga as mensagens, apenas fecha os canais de conversa.`, async () => {
            const cancelState = { cancelled: false };
            const progressModal = document.createElement("div");
            progressModal.className = "dfm-modal";
            progressModal.innerHTML = `
                <div class="dfm-modal-content">
                    <div class="dfm-modal-title">Fechando DMs</div>
                    <div class="dfm-progress-container">
                        <div class="dfm-progress-text" id="progress-text">0 DMs fechadas</div>
                        <div class="dfm-progress-bar-container">
                            <div class="dfm-progress-bar" id="progress-bar" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="dfm-progress-actions">
                        <button class="dfm-btn-cancel" id="cancel-operation">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(progressModal);

            const progressText = progressModal.querySelector("#progress-text");
            const progressBar = progressModal.querySelector("#progress-bar");
            const cancelBtn = progressModal.querySelector("#cancel-operation");

            cancelBtn.addEventListener("click", () => {
                cancelState.cancelled = true;
                cancelBtn.disabled = true;
                cancelBtn.textContent = "Cancelando...";
            });

            let closedCount = 0;
            const delay = ms => new Promise(r => setTimeout(r, ms));

            while (true) {
                if (cancelState.cancelled) break;

                const closeButtons = document.querySelectorAll('[aria-label="Fechar mensagem direta"]');
                if (!closeButtons.length) break;

                closeButtons[0].click();
                await delay(300);

                const confirmCancelButton = [...document.querySelectorAll('button')]
                    .find(b =>
                        b.textContent.trim() === 'Cancelar' &&
                        !b.closest('.dfm-modal')
                    );

                if (confirmCancelButton) {
                    confirmCancelButton.click();
                    await delay(300);
                }

                closedCount++;
                progressText.textContent = `${closedCount} DMs fechadas`;
                progressBar.style.width = "100%";
            }

            progressModal.remove();

            if (cancelState.cancelled) {
                showNotification(`Cancelado! ${closedCount} DMs foram fechadas.`, "warning");
            } else {
                showNotification(`${closedCount} DMs fechadas com sucesso!`, "success");
            }
        });
    };

    const filterItems = (items, searchTerm) => searchTerm ? items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) : items;

    const renderFriends = (friends, searchTerm = "") => {
        const content = document.getElementById("friends-tab");
        const filteredFriends = filterItems(friends.map(f => ({ ...f, name: f.user.global_name || f.user.username })), searchTerm);

        if (!filteredFriends.length) {
            content.innerHTML = `
                <div class="dfm-search-container">
                    <input type="text" class="dfm-search" id="friends-search" placeholder="Buscar amigos..." value="${searchTerm}">
                </div>
                <div class="dfm-empty">${searchTerm ? "Nenhum amigo encontrado" : "Nenhum amigo"}</div>
            `;
            if (searchTerm) content.querySelector("#friends-search").addEventListener("input", e => renderFriends(friends, e.target.value));
            return;
        }

        content.innerHTML = `
            <div class="dfm-search-container">
                <input type="text" class="dfm-search" id="friends-search" placeholder="Buscar amigos..." value="${searchTerm}">
            </div>
            <div class="dfm-actions">
                <button class="dfm-btn secondary" id="refresh-friends">Atualizar</button>
                <button class="dfm-btn" id="remove-selected-friends">Remover Selecionados</button>
                <button class="dfm-btn danger" id="remove-all-friends">Remover Todos</button>
            </div>
            ${filteredFriends.map(f => `
                <div class="dfm-friend" data-id="${f.id}" data-name="${f.user.global_name || f.user.username}" data-avatar="https://cdn.discordapp.com/avatars/${f.id}/${f.user.avatar}.png">
                    <input type="checkbox" class="dfm-checkbox">
                    <img class="dfm-avatar" src="https://cdn.discordapp.com/avatars/${f.id}/${f.user.avatar}.png" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                    <div class="dfm-info"><div class="dfm-name">${f.user.global_name || f.user.username}</div></div>
                    <div class="dfm-friend-actions">
                        <button class="dfm-delete-messages">Apagar Mensagens</button>
                        <button class="dfm-remove">Remover</button>
                    </div>
                </div>
            `).join("")}
        `;

        const searchInput = content.querySelector("#friends-search");
        let searchTimeout;
        searchInput.addEventListener("input", e => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => renderFriends(friends, e.target.value), 300); });
        searchInput.addEventListener("keypress", e => { if (e.key === "Enter") { clearTimeout(searchTimeout); renderFriends(friends, e.target.value); } });

        content.querySelectorAll(".dfm-checkbox").forEach(cb => cb.addEventListener("change", e => e.target.closest(".dfm-friend").classList.toggle("selected", e.target.checked)));
        content.querySelectorAll(".dfm-delete-messages").forEach(btn => btn.onclick = e => { const el = e.target.closest(".dfm-friend"); deleteAllMessages(el.dataset.id, el.dataset.name); });
        content.querySelectorAll(".dfm-remove").forEach(btn => btn.onclick = async e => {
            const el = e.target.closest(".dfm-friend");
            e.target.disabled = true;
            e.target.textContent = "Removendo...";
            await removeFriend(el.dataset.id, el.dataset.name, el.dataset.avatar);
            el.remove();
        });

        document.getElementById("refresh-friends").onclick = async () => {
            const btn = document.getElementById("refresh-friends");
            btn.disabled = true;
            btn.textContent = "Atualizando...";
            const friendsData = await fetchFriends();
            renderFriends(friendsData.filter(f => f.type === 1), searchInput.value);
            btn.disabled = false;
            btn.textContent = "Atualizar";
            showNotification("Lista atualizada!", "success");
        };

        document.getElementById("remove-selected-friends").onclick = async () => {
            const selected = Array.from(content.querySelectorAll(".dfm-friend.selected"));
            if (!selected.length) { showNotification("Selecione pelo menos um amigo!", "warning"); return; }

            showConfirmModal(`Remover ${selected.length} amigo(s)?`, async () => {
                const { modal: progressModal, state: cancelState } = createProgressModal("Removendo Amigos", selected.length);
                document.body.appendChild(progressModal);
                const progressText = progressModal.querySelector("#progress-text");
                const progressBar = progressModal.querySelector("#progress-bar");
                let removedCount = 0;

                for (let i = 0; i < selected.length; i++) {
                    if (cancelState.cancelled) break;
                    const el = selected[i];
                    await removeFriend(el.dataset.id, el.dataset.name, el.dataset.avatar);
                    el.remove();
                    removedCount++;
                    updateProgress(progressText, progressBar, i + 1, selected.length, "Removendo");
                    await new Promise(r => setTimeout(r, requestDelay));
                }

                progressModal.remove();
                showNotification(cancelState.cancelled ? `Cancelado! ${removedCount} amigos removidos.` : `${selected.length} amigos removidos!`, cancelState.cancelled ? "warning" : "success");
            });
        };

        document.getElementById("remove-all-friends").onclick = async () => {
            const allFriends = Array.from(content.querySelectorAll(".dfm-friend"));
            if (!allFriends.length) { showNotification("Nenhum amigo para remover!", "warning"); return; }

            showConfirmModal(`ATENÇÃO! Remover TODOS os ${allFriends.length} amigos?<br><br>Esta ação não pode ser desfeita!`, async () => {
                const { modal: progressModal, state: cancelState } = createProgressModal("Removendo Amigos", allFriends.length);
                document.body.appendChild(progressModal);
                const progressText = progressModal.querySelector("#progress-text");
                const progressBar = progressModal.querySelector("#progress-bar");
                let removedCount = 0;

                for (let i = 0; i < allFriends.length; i++) {
                    if (cancelState.cancelled) break;
                    const el = allFriends[i];
                    await removeFriend(el.dataset.id, el.dataset.name, el.dataset.avatar);
                    el.remove();
                    removedCount++;
                    updateProgress(progressText, progressBar, i + 1, allFriends.length, "Removendo");
                    await new Promise(r => setTimeout(r, requestDelay));
                }

                progressModal.remove();
                if (cancelState.cancelled) {
                    showNotification(`Cancelado! ${removedCount} amigos removidos.`, "warning");
                } else {
                    content.innerHTML = `
                        <div class="dfm-search-container"><input type="text" class="dfm-search" id="friends-search" placeholder="Buscar amigos..."></div>
                        <div class="dfm-empty">Nenhum amigo</div>
                    `;
                    showNotification("Todos os amigos removidos!", "success");
                }
            });
        };
    };

    const renderServers = (servers, searchTerm = "") => {
        const content = document.getElementById("servers-tab");
        const filteredServers = servers.filter(s => !s.owner);
        const filteredAndSearched = filterItems(filteredServers, searchTerm);

        if (!filteredAndSearched.length) {
            content.innerHTML = `
                <div class="dfm-search-container">
                    <input type="text" class="dfm-search" id="servers-search" placeholder="Buscar servidores..." value="${searchTerm}">
                </div>
                <div class="dfm-empty">${searchTerm ? "Nenhum servidor encontrado" : "Nenhum servidor"}</div>
            `;
            if (searchTerm) content.querySelector("#servers-search").addEventListener("input", e => renderServers(servers, e.target.value));
            return;
        }

        content.innerHTML = `
            <div class="dfm-search-container">
                <input type="text" class="dfm-search" id="servers-search" placeholder="Buscar servidores..." value="${searchTerm}">
            </div>
            <div class="dfm-actions">
                <button class="dfm-btn secondary" id="refresh-servers">Atualizar</button>
                <button class="dfm-btn" id="leave-selected-servers">Remover Selecionados</button>
                <button class="dfm-btn danger" id="leave-all-servers">Remover Todos</button>
            </div>
            ${filteredAndSearched.map(s => {
                const iconUrl = s.icon ? `https://cdn.discordapp.com/icons/${s.id}/${s.icon}.png` : "https://cdn.discordapp.com/embed/avatars/0.png";
                return `
                    <div class="dfm-server" data-id="${s.id}" data-name="${s.name}" data-icon="${iconUrl}">
                        <input type="checkbox" class="dfm-checkbox">
                        <img class="dfm-server-icon" src="${iconUrl}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                        <div class="dfm-info"><div class="dfm-name">${s.name}</div></div>
                        <div class="dfm-server-actions"><button class="dfm-leave-server">Remover</button></div>
                    </div>
                `;
            }).join("")}
        `;

        const searchInput = content.querySelector("#servers-search");
        let searchTimeout;
        searchInput.addEventListener("input", e => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => renderServers(servers, e.target.value), 300); });
        searchInput.addEventListener("keypress", e => { if (e.key === "Enter") { clearTimeout(searchTimeout); renderServers(servers, e.target.value); } });

        content.querySelectorAll(".dfm-checkbox").forEach(cb => cb.addEventListener("change", e => e.target.closest(".dfm-server").classList.toggle("selected", e.target.checked)));
        content.querySelectorAll(".dfm-leave-server").forEach(btn => btn.onclick = async e => {
            const el = e.target.closest(".dfm-server");
            e.target.disabled = true;
            e.target.textContent = "Saindo...";
            await leaveServer(el.dataset.id, el.dataset.name, el.dataset.icon);
            el.remove();
        });

        document.getElementById("refresh-servers").onclick = async () => {
            const btn = document.getElementById("refresh-servers");
            btn.disabled = true;
            btn.textContent = "Atualizando...";
            const serversData = await fetchServers();
            renderServers(serversData, searchInput.value);
            btn.disabled = false;
            btn.textContent = "Atualizar";
            showNotification("Lista atualizada!", "success");
        };

        document.getElementById("leave-selected-servers").onclick = async () => {
            const selected = Array.from(content.querySelectorAll(".dfm-server.selected"));
            if (!selected.length) { showNotification("Selecione pelo menos um servidor!", "warning"); return; }

            showConfirmModal(`Sair de ${selected.length} servidor(es)?`, async () => {
                const { modal: progressModal, state: cancelState } = createProgressModal("Saindo de Servidores", selected.length);
                document.body.appendChild(progressModal);
                const progressText = progressModal.querySelector("#progress-text");
                const progressBar = progressModal.querySelector("#progress-bar");
                let leftCount = 0;

                for (let i = 0; i < selected.length; i++) {
                    if (cancelState.cancelled) break;
                    const el = selected[i];
                    await leaveServer(el.dataset.id, el.dataset.name, el.dataset.icon);
                    el.remove();
                    leftCount++;
                    updateProgress(progressText, progressBar, i + 1, selected.length, "Saindo de");
                    await new Promise(r => setTimeout(r, requestDelay));
                }

                progressModal.remove();
                showNotification(cancelState.cancelled ? `Cancelado! Saiu de ${leftCount} servidores.` : `Saiu de ${selected.length} servidores!`, cancelState.cancelled ? "warning" : "success");
            });
        };

        document.getElementById("leave-all-servers").onclick = async () => {
            const allServers = Array.from(content.querySelectorAll(".dfm-server"));
            if (!allServers.length) { showNotification("Nenhum servidor para sair!", "warning"); return; }

            showConfirmModal(`ATENÇÃO! Sair de TODOS os ${allServers.length} servidores?<br><br>Esta ação não pode ser desfeita!`, async () => {
                const { modal: progressModal, state: cancelState } = createProgressModal("Saindo de Servidores", allServers.length);
                document.body.appendChild(progressModal);
                const progressText = progressModal.querySelector("#progress-text");
                const progressBar = progressModal.querySelector("#progress-bar");
                let leftCount = 0;

                for (let i = 0; i < allServers.length; i++) {
                    if (cancelState.cancelled) break;
                    const el = allServers[i];
                    await leaveServer(el.dataset.id, el.dataset.name, el.dataset.icon);
                    el.remove();
                    leftCount++;
                    updateProgress(progressText, progressBar, i + 1, allServers.length, "Saindo de");
                    await new Promise(r => setTimeout(r, requestDelay));
                }

                progressModal.remove();
                if (cancelState.cancelled) {
                    showNotification(`Cancelado! Saiu de ${leftCount} servidores.`, "warning");
                } else {
                    content.innerHTML = `
                        <div class="dfm-search-container"><input type="text" class="dfm-search" id="servers-search" placeholder="Buscar servidores..."></div>
                        <div class="dfm-empty">Nenhum servidor</div>
                    `;
                    showNotification("Saiu de todos os servidores!", "success");
                }
            });
        };
    };

    const container = document.createElement("div");
    container.id = "discord-friend-manager";
    container.innerHTML = `
        <div class="dfm-header">
            <div class="dfm-title">Discord Manager</div>
            <div class="dfm-controls">
                <button class="dfm-btn-icon" id="dfm-settings" title="Configurações">⚙</button>
                <button class="dfm-btn-icon" id="dfm-minimize" title="Minimizar">−</button>
            </div>
        </div>
        <div class="dfm-tabs">
            <button class="dfm-tab active" data-tab="friends">Usuários</button>
            <button class="dfm-tab" data-tab="servers">Servidores</button>
            <button class="dfm-tab" data-tab="advanced">Avançado</button>
        </div>
        <div class="dfm-content">
            <div class="dfm-tab-content active" id="friends-tab"><div class="dfm-loading">Carregando amigos</div></div>
            <div class="dfm-tab-content" id="servers-tab"><div class="dfm-loading">Carregando servidores</div></div>
            <div class="dfm-tab-content" id="advanced-tab">
                <div class="dfm-advanced-section">
                    <div class="dfm-section-title">Deletar Mensagens por ID</div>
                    <div class="dfm-section-description">Delete suas mensagens de uma conversa usando o ID do usuário (funciona mesmo que não seja mais amigo)</div>
                    <div class="dfm-input-group">
                        <input type="text" class="dfm-input" id="delete-msgs-user-id" placeholder="ID do usuário">
                        <button class="dfm-btn" id="delete-msgs-by-id">Deletar Mensagens</button>
                    </div>
                </div>
                <div class="dfm-advanced-section">
                    <div class="dfm-section-title">Silenciar Todos os Servidores</div>
                    <div class="dfm-section-description">Silencia as notificações de todos os servidores que você participa. Você ainda poderá ver as mensagens, mas não receberá notificações.</div>
                    <button class="dfm-btn warning" id="mute-all-servers">Silenciar Todos os Servidores</button>
                </div>
                <div class="dfm-advanced-section">
                    <div class="dfm-section-title">Fechar Todas as DMs</div>
                    <div class="dfm-section-description">Fecha todas as conversas privadas abertas. Isso não apaga as mensagens, apenas fecha os canais de DM.</div>
                    <button class="dfm-btn danger" id="close-all-dms">Fechar Todas as DMs</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    const openManager = () => {
        if (isAnimating || isManagerOpen) return;
        isAnimating = true;
        isManagerOpen = true;
        const containerWidth = Math.min(700, window.innerWidth - 40);
        const containerHeight = Math.min(600, window.innerHeight - 40);
        container.style.left = `${(window.innerWidth - containerWidth) / 2}px`;
        container.style.top = `${(window.innerHeight - containerHeight) / 2}px`;
        container.style.transform = "none";
        container.classList.remove("closing");
        container.classList.add("visible");
        setTimeout(() => { isAnimating = false; }, 250);
    };

    const closeManager = () => {
        if (isAnimating || !isManagerOpen) return;
        isAnimating = true;
        container.classList.remove("visible");
        container.classList.add("closing");
        setTimeout(() => { container.classList.remove("closing"); isManagerOpen = false; isAnimating = false; }, 250);
    };

    const createDiscordManagerButton = () => {
        if (document.getElementById("discord-manager-nav-button")) return true

        const questsItem = document
            .querySelector('[data-list-item-id*="quests"]')
            ?.closest("li")

        if (!questsItem?.parentNode) return false

        const managerButton = questsItem.cloneNode(true)
        managerButton.id = "discord-manager-nav-button"

        const link = managerButton.querySelector("a")
        const name = managerButton.querySelector('[class*="name"]')
        const icon = managerButton.querySelector('[class*="linkButtonIcon"]')

        if (!link || !name || !icon) return false

        name.textContent = "Discord Manager"

        link.dataset.listItemId = "private-channels-uid_30___discord_manager"
        link.href = "#"

        managerButton
            .querySelectorAll('[class*="selected"]')
            .forEach(el => el.className = el.className.replace(/\bselected\S*\b/g, ""))

        icon.setAttribute("viewBox", "0 0 24 24")
        icon.setAttribute("fill", "none")
        icon.setAttribute("stroke", "currentColor")
        icon.setAttribute("stroke-width", "2")
        icon.setAttribute("stroke-linecap", "round")
        icon.setAttribute("stroke-linejoin", "round")

        icon.innerHTML = `
            <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/>
            <circle cx="12" cy="12" r="3"/>
        `

        link.onclick = e => {
            e.preventDefault()
            e.stopPropagation()
            openManager()
        }

        questsItem.parentNode.insertBefore(managerButton, questsItem.nextSibling)

        return true
    }

    const header = container.querySelector(".dfm-header");
    header.addEventListener("mousedown", e => {
        if (e.target.closest(".dfm-btn-icon")) return;
        isDragging = true;
        const rect = container.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        container.style.transition = "none";
        container.style.transform = "none";
    });

    document.addEventListener("mousemove", e => {
        if (!isDragging) return;
        e.preventDefault();
        const maxX = window.innerWidth - container.offsetWidth;
        const maxY = window.innerHeight - container.offsetHeight;
        container.style.left = `${Math.max(0, Math.min(maxX, e.clientX - offsetX))}px`;
        container.style.top = `${Math.max(0, Math.min(maxY, e.clientY - offsetY))}px`;
    });

    document.addEventListener("mouseup", () => { if (isDragging) { isDragging = false; container.style.transition = "none"; } });

    window.addEventListener("resize", () => {
        if (!isManagerOpen) return;
        const rect = container.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        if (rect.left > maxX) container.style.left = `${Math.max(0, maxX)}px`;
        if (rect.top > maxY) container.style.top = `${Math.max(0, maxY)}px`;
    });

    container.querySelector("#dfm-settings").addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); showSettingsModal(); });
    container.querySelector("#dfm-minimize").addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); closeManager(); });

    const deleteMsgsByIdBtn = container.querySelector("#delete-msgs-by-id");
    const deleteMsgsInput = container.querySelector("#delete-msgs-user-id");
    deleteMsgsByIdBtn.addEventListener("click", () => deleteMessagesByUserId(deleteMsgsInput.value));
    deleteMsgsInput.addEventListener("keypress", e => { if (e.key === "Enter") deleteMessagesByUserId(deleteMsgsInput.value); });

    container.querySelector("#mute-all-servers").addEventListener("click", () => muteAllServers());
    container.querySelector("#close-all-dms").addEventListener("click", () => closeAllDMs());

    container.querySelectorAll(".dfm-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            container.querySelectorAll(".dfm-tab").forEach(t => t.classList.remove("active"));
            container.querySelectorAll(".dfm-tab-content").forEach(c => c.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add("active");
        });
    });

    setInterval(() => { if (!document.getElementById("discord-manager-nav-button")) createDiscordManagerButton(); }, 2000);

    try {
        const [friendsData, serversData] = await Promise.all([fetchFriends(), fetchServers()]);
        renderFriends(friendsData.filter(f => f.type === 1));
        renderServers(serversData);
    } catch {
        document.getElementById("friends-tab").innerHTML = `
            <div class="dfm-search-container"><input type="text" class="dfm-search" id="friends-search" placeholder="Buscar amigos..."></div>
            <div class="dfm-empty">Erro ao carregar amigos</div>
        `;
        document.getElementById("servers-tab").innerHTML = `
            <div class="dfm-search-container"><input type="text" class="dfm-search" id="servers-search" placeholder="Buscar servidores..."></div>
            <div class="dfm-empty">Erro ao carregar servidores</div>
        `;
        showNotification("Erro ao carregar dados", "error");
    }

    createDiscordManagerButton();
})();
