function makeHeader() {
    const header = document.createElement("header");
    header.innerHTML = `
        <a href="https://westerbay.github.io/Home-Page/">
            <img src="shared/img/icon.png" alt="" class="circle">
            <img src="shared/img/wester.png" alt="Wester">
        </a>
        <nav>
            <a href="https://westerbay.github.io/Home-Page/" id="navHome">Home</a>
            <a href="https://westerbay.github.io/Home-Page/about/" id="navAbout">About</a>
            <a href="https://westerbay.github.io/Home-Page/projects/" id="navProject">Project</a>
            <a href="https://westerbay.github.io/Home-Page/projects/" id="navPrototype">Prototype</a>
        </nav>
    `;
    document.body.insertBefore(header, document.body.firstChild);
}

function makeFooter() {
    const footer = document.createElement("footer");
    footer.innerHTML = `
        <nav>
            <a href="https://www.youtube.com/@Westerbay" target="_blank"><img src="shared/logo/yt.png" alt="Youtube"></a>
            <a href="https://github.com/Westerbay" target="_blank"><img src="shared/logo/github.svg" alt="GitHub"></a>
            <a href="https://westerbay.itch.io/" target="_blank"><img src="shared/logo/itchIO.png" alt="itch.io"></a>
            <a href="https://play.google.com/store/apps/dev?id=5075211406810866844" target="_blank"><img src="shared/logo/playStore.png" alt="Google Play Store"></a>
            <a href="https://www.linkedin.com/in/mathis-dubuisson" target="_blank"><img src="shared/logo/LinkedIn.png" alt="LinkedIn"></a>
        </nav>
    `;
    document.body.appendChild(footer);
}

function load(pagename) {
    makeHeader();
    makeFooter();
    try {
        const idNav = `nav${pagename}`;
        const navElement = document.getElementById(idNav);
        navElement.classList.add("selected");
    } catch (ignored) {}
}
