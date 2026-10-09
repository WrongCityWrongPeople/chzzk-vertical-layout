
 // ==UserScript==
 // @name         치지직 채팅창 드래그 조절
 // @namespace    chzzk-custom-layout
 // @version      1.1.1
 // @description  넓은 화면 모드의 채팅 높이 조절
 // @match        https://chzzk.naver.com/live/*
 // @run-at       document-idle
 // @grant        none
 // ==/UserScript==

 (() => {
   'use strict';

   const KEY = 'chzzk-chat-height-v1';

   function setup() {
     const section = document.querySelector(
       '#layout-body > section[class*="_is_large_wj4te_"]'
     );

     const wrapper = section?.querySelector(
       ':scope > div[class*="_wrapper_wj4te_"]'
     );

     const chat = wrapper?.querySelector(
       ':scope > #aside-chatting'
     );

     const oldBar = document.getElementById(
       'custom-chat-resizer'
     );

     if (!wrapper || !chat) {
       oldBar?.remove();
       return;
     }

     if (oldBar && oldBar.parentElement === wrapper &&
         oldBar.nextElementSibling === chat) {
       return;
     }

     oldBar?.remove();

     if (getComputedStyle(wrapper).flexDirection !== 'column') {
       return;
     }

     const saved = Number(localStorage.getItem(KEY));

     if (saved >= 15 && saved <= 70) {
       chat.style.setProperty(
         '--chzzk-chat-height', saved + 'vh'
       );
     }

     const bar = document.createElement('div');
     bar.id = 'custom-chat-resizer';
     bar.title = '드래그해서 채팅창 높이 변경';

     Object.assign(bar.style, {
       height: '12px',
       flex: '0 0 12px',
       width: '100%',
       background: '#30363f',
       cursor: 'row-resize',
       display: 'flex',
       justifyContent: 'center',
       alignItems: 'center',
       touchAction: 'none',
       zIndex: '100'
     });

     const grip = document.createElement('div');

     Object.assign(grip.style, {
       width: '80px',
       height: '4px',
       background: '#929ca8',
       borderRadius: '4px',
       pointerEvents: 'none'
     });

     bar.appendChild(grip);
     wrapper.insertBefore(bar, chat);

     bar.addEventListener('pointerdown', (e) => {
       if (e.button !== 0) return;

       e.preventDefault();
       bar.setPointerCapture(e.pointerId);

       const startY = e.clientY;
       const startHeight = chat.getBoundingClientRect().height;
       const oldSelection = document.body.style.userSelect;

       document.body.style.userSelect = 'none';

       function move(ev) {
         if (ev.pointerId !== e.pointerId) return;

         const wrapperHeight =
           wrapper.getBoundingClientRect().height;

         const maxHeight = Math.max(
           180,
           Math.min(
             window.innerHeight * 0.7,
             wrapperHeight - 180
           )
         );

         const newHeight = Math.max(
           Math.min(180, maxHeight),
           Math.min(
             maxHeight,
             startHeight - (ev.clientY - startY)
           )
         );

         const vh = (
           newHeight / window.innerHeight * 100
         ).toFixed(2);

         chat.style.setProperty(
           '--chzzk-chat-height', vh + 'vh'
         );
       }

       function end(ev) {
         if (ev.pointerId !== e.pointerId) return;

         document.body.style.userSelect = oldSelection;

         bar.removeEventListener('pointermove', move);
         bar.removeEventListener('pointerup', end);
         bar.removeEventListener('pointercancel', end);

         const value = parseFloat(
           chat.style.getPropertyValue('--chzzk-chat-height')
         );

         if (Number.isFinite(value)) {
           localStorage.setItem(KEY, value);
         }
       }

       bar.addEventListener('pointermove', move);
       bar.addEventListener('pointerup', end);
       bar.addEventListener('pointercancel', end);
     });
   }


  let scheduled = false;

  const observer = new MutationObserver((mutations) => {
    const onlyChatChanges = mutations.every(
      (mutation) =>
        mutation.target instanceof Element &&
        mutation.target.closest('#aside-chatting')
    );

    if (onlyChatChanges) return;
    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      setup();
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  setup();
})();

