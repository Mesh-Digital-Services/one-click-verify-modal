const ReactAppUrl = 'https://staging.one-click-verify.mesh.id';
window.MeshVerify = {
    config: {
        isListenersRegistered: false,
        sessionId: null, // have to be provided during start verify by client
        origin: window.origin,
        iframeUrl: ReactAppUrl, // react app host url
    },
    registerPostEventMsgListener: function () {
        if (this.config.isListenersRegistered) return;
        const { eventer, messageEvent } = this.getEventer();
        eventer(messageEvent, (function (e) {
            if (e.origin !== this.getOriginFromUrl(this.config.iframeUrl)) return;
            if (typeof e.data === 'object') {
                if (e.data.eventName === 'onFinish') {
                    this.destroyModal();
                    this.onFinish({ exitPage: e.data.payload.exitPage });
                }
            }
        }).bind(this));
        this.config.isListenersRegistered = true;
    },
    startVerify: function ({ onFinish, sessionId }) {
        const isOnContinueFunc = typeof onFinish === 'function';
        if (!isOnContinueFunc || !sessionId) {
            if (!sessionId) console.error('please provide session id');
            if (!isOnContinueFunc) console.error('please provide onFinish callback');
            return;
        }
        this.onFinish = onFinish;
        this.config.sessionId = sessionId;
        this.registerPostEventMsgListener();
        this.buildModal();
    },
    destroyModal: function () {
        document.getElementById('mesh-modal-overlay').remove();
        document.getElementById('mesh-modalBackdrop').remove();
    },
    buildModal: function () {
        this.injectStyles();
        const overlay = document.createElement('div');
        overlay.id = 'mesh-modal-overlay';
        const modal = document.createElement('div');
        modal.id = 'mesh-modal';
        const closeBtn = document.createElement('button');
        closeBtn.id = 'mesh-close-btn';
        closeBtn.innerHTML = '&times;';
        overlay.addEventListener('click', this.destroyModal.bind(this));
        modal.appendChild(this.getIframeElement());
        modal.appendChild(closeBtn);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        const modalBackdrop = document.createElement('div');
        modalBackdrop.id = 'mesh-modalBackdrop';
        document.body.appendChild(modalBackdrop)
    },
    getIframeElement: function () {
        const iframe = document.createElement('iframe');
        iframe.src = `${this.config.iframeUrl}?sessionId=${this.config.sessionId}&origin=${this.config.origin}`;
        iframe.name = 'frame';
        iframe.id = 'mesh-iframe';
        return iframe;
    },
    injectStyles: function () {
        if (document.getElementById('mesh-stylesheet')) return;
        const sheet = document.createElement('style');
        sheet.id = 'mesh-stylesheet';
        sheet.innerHTML = `      
            #mesh-iframe { width: 100%; height: 100%; background-color: rgb(255 255 255); border-radius: 6px; box-shadow: 0 3px 7px rgb(0 0 0 / 30%); }
            #mesh-modalBackdrop { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 2147483640; background-color: rgb(0 0 0); opacity: 0.5;}
            #mesh-close-btn { font-size: 40px; position: absolute; right: 7px; top: -7px; outline: none; border: none; box-shadow: none; background: none;}
            #mesh-modal-overlay { z-index: 2147483647; position: fixed; top: 0; right: 0; bottom: 0; left: 0;}
            #mesh-modal { margin: auto; margin-top: 40px; width: 510px; height: 90%; max-width: 95%; position: relative; }
        `;
        document.head.appendChild(sheet);
    },
    getOriginFromUrl: function (url) {
        const pathArray = url.split('/');
        const protocol = pathArray[0];
        const host = pathArray[2];
        return protocol + '//' + host;
    },
    getEventer: function () {
        const eventMethod = window.addEventListener
            ? 'addEventListener'
            : 'attachEvent';
        const eventer = window[eventMethod];
        const messageEvent = eventMethod === 'attachEvent'
            ? 'onmessage'
            : 'message';
        return { eventer, messageEvent }
    }
}
