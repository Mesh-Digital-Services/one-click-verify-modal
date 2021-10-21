window.MeshVerify = {
    config: {
        isListenersRegistered: false,
        meshUserId: null, // have to be provided during start verify by client
        origin: window.origin,
        iframeUrl: 'https://one-click-verify.mesh.id',
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
    startVerify: function ({ onFinish, meshUserId }) {
        const isOnContinueFunc = typeof onFinish === 'function';
        if (!isOnContinueFunc || !meshUserId) {
            if (!meshUserId) console.error('please provide Mesh User id');
            if (!isOnContinueFunc) console.error('please provide onFinish callback');
            return;
        }
        this.onFinish = onFinish;
        this.config.meshUserId = meshUserId;
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
        closeBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.4717 0.156287C10.4222 0.106739 10.3634 0.0674344 10.2987 0.0406184C10.234 0.0138024 10.1646 0 10.0945 0C10.0245 0 9.9551 0.0138024 9.89038 0.0406184C9.82566 0.0674344 9.76686 0.106739 9.71733 0.156287L5.31386 4.55988L0.910397 0.156287C0.860862 0.106752 0.802057 0.0674588 0.737337 0.0406509C0.672616 0.013843 0.60325 4.47605e-05 0.533197 4.47591e-05C0.463145 4.47577e-05 0.393778 0.013843 0.329058 0.0406509C0.264338 0.0674588 0.205532 0.106751 0.155997 0.156286C0.106463 0.205821 0.06717 0.264627 0.040362 0.329347C0.0135541 0.394067 -0.000244142 0.463434 -0.000244141 0.533486C-0.000244139 0.603539 0.0135541 0.672905 0.040362 0.737625C0.06717 0.802345 0.106463 0.861151 0.155998 0.910686L4.5596 5.31415L0.155998 9.71761C0.055958 9.81765 -0.000243633 9.95334 -0.000243632 10.0948C-0.000243631 10.2363 0.055958 10.372 0.155998 10.472C0.256037 10.5721 0.39172 10.6283 0.533197 10.6283C0.674675 10.6283 0.810357 10.5721 0.910397 10.472L5.31386 6.06842L9.71733 10.472C9.81737 10.5721 9.95305 10.6283 10.0945 10.6283C10.236 10.6283 10.3717 10.5721 10.4717 10.472C10.5718 10.372 10.628 10.2363 10.628 10.0948C10.628 9.95334 10.5718 9.81765 10.4717 9.71761L6.06813 5.31415L10.4717 0.910686C10.5213 0.861158 10.5606 0.802355 10.5874 0.737634C10.6142 0.672913 10.628 0.603543 10.628 0.533486C10.628 0.46343 10.6142 0.394059 10.5874 0.329338C10.5606 0.264617 10.5213 0.205814 10.4717 0.156287Z" fill="black"/>
        </svg>`;
        overlay.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.destroyModal();
        });
        closeBtn.addEventListener('click', this.destroyModal);
        modal.appendChild(closeBtn);
        modal.appendChild(this.getIframeElement());
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        const modalBackdrop = document.createElement('div');
        modalBackdrop.id = 'mesh-modalBackdrop';
        document.body.appendChild(modalBackdrop)
    },
    getIframeElement: function () {
        const iframe = document.createElement('iframe');
        iframe.src = `${this.config.iframeUrl}?meshUserId=${this.config.meshUserId}&origin=${this.config.origin}`;
        iframe.name = 'frame';
        iframe.id = 'mesh-iframe';
        return iframe;
    },
    injectStyles: function () {
        if (document.getElementById('mesh-stylesheet')) return;
        const sheet = document.createElement('style');
        sheet.id = 'mesh-stylesheet';
        sheet.innerHTML = `      
            #mesh-iframe { width: 100%; height: 100%; background-color: rgb(255 255 255); border: none; }
            #mesh-modalBackdrop { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 2147483640; background-color: rgb(0 0 0); opacity: 0.5;}
            #mesh-close-btn {  outline: none; border: none; box-shadow: none; background: none; position: absolute; right: 5px; top: 5px;}
            #mesh-modal-overlay { z-index: 2147483647; position: fixed; top: 0; right: 0; bottom: 0; left: 0;}
            #mesh-modal { background-color: white; overflow:hidden; box-shadow: 0 6px 7px rgb(0 0 0 / 30%); margin: auto; margin-top: 40px; width: 496px; height: 90%; max-width: 95%; position: relative; border-radius: 6px; }
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
