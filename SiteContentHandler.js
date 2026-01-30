//Class for generating and managing HTML elements.
export default class SiteContentHandler
{
    constructor()
    {
        //Containers
        this.divContainer = document.getElementById("container");
        this.divClipboardContainer = document.createElement("div");
        this.divLoadingContainer = document.getElementById("loading-container");

        //Buttons
        this.clipboardLeftButton = document.createElement("button");
        this.clipboardLeftButton.className = "left-btn";

        this.clipboardRightButton = document.createElement("button");
        this.clipboardRightButton.className = "right-btn";

        //Icons
        this.iconAnglesDown = document.createElement("i");
        this.iconAnglesDown.className = "fa fa-angle-double-down";

        this.iconChevronLeft = document.createElement("i");
        this.iconChevronLeft.className = "fa fa-chevron-left";

        this.iconChevronRight = document.createElement("i");
        this.iconChevronRight.className = "fa fa-chevron-right";

        this.divPageIndicator = document.getElementById("page-indicator");

        //Content
        this.divMonitor = document.createElement("div");
        this.divMonitor.className = "floating-div-monitor";

        this.divClipboard = document.createElement("div");
        this.divClipboard.className = "floating-div-clipboard";

        this.divNote = document.createElement("div");
        this.divNote.className = "floating-div-note";
        
        this.divMonitorName = document.createElement("div");
        this.divMonitorDesc = document.createElement("div");

        this.InitLoading()
    }

    InitLoading()
    {
        const loadingIcon = document.createElement("div");
        loadingIcon.className = "loading-icon";
        this.divLoadingContainer.append(loadingIcon);

        window.addEventListener("load", () =>
        {
            if (localStorage.getItem("firstVisit") === null)
            {
                console.log("Site has been visited for the first time, storing this visit in cache.");
                localStorage.setItem("firstVisit", "true");
                const divFirstVisit = document.createElement("div");
                divFirstVisit.className = "first-visit";
                divFirstVisit.innerHTML = `
                Welcome to my WebGL-based Porfolio! The graphics engine is setting some things up, this won't take long!
                `;
                this.divLoadingContainer.append(divFirstVisit);
            }
        });
    }

    InitHTMLElements()
    {
        this.divLoadingContainer.remove(); //Loading has been completed, so remove the loading elements.

        this.divContainer.append(this.iconAnglesDown);
        this.clipboardLeftButton.append(this.iconChevronLeft);
        this.clipboardRightButton.append(this.iconChevronRight);
        this.divContainer.append(this.clipboardLeftButton);
        this.divContainer.append(this.clipboardRightButton);

        this.divMonitor.append(this.divMonitorName);
        this.divMonitor.append(this.divMonitorDesc);
        this.divContainer.append(this.divMonitor);
        this.divClipboardContainer.append(this.divClipboard);
        this.divClipboardContainer.append(this.divNote);
        this.divContainer.append(this.divClipboardContainer);
    }
}