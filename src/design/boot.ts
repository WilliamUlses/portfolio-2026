// Inline head boot script setting `data-js`, resolving theme preference, and deciding preloader activation before initial render
export const LOADER_KEY = "wu-loaded";
export const THEME_KEY = "wu-theme";

export const bootScript = `(function(){var d=document.documentElement;d.dataset.js="";try{var t=localStorage.getItem("${THEME_KEY}")||(document.cookie.match(/(?:^|; )${THEME_KEY}=([^;]*)/)||[])[1];if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){d.classList.add("dark");d.dataset.theme="dark"}else if(t==="light"){d.classList.add("light");d.dataset.theme="light"}}catch(e){}try{if(/^[/](fr|en)[/]?$/.test(location.pathname)&&!sessionStorage.getItem("${LOADER_KEY}")&&!navigator.webdriver&&matchMedia("(prefers-reduced-motion: no-preference)").matches)d.dataset.loader=""}catch(e){}})()`;
