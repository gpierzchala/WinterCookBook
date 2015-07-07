(function () {
    "use strict";

    var storage = Windows.Storage;
    var dtm = Windows.ApplicationModel.DataTransfer.DataTransferManager;
    var item;
    var capture = Windows.Media.Capture;
    var _photo;
    var _video;

    WinJS.UI.Pages.define("/pages/itemDetail/itemDetail.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            item = options && options.item ? Data.resolveItemReference(options.item) : Data.items.getAt(0);
            element.querySelector(".titlearea .pagetitle").textContent = item.group.title;
            element.querySelector("article .item-title").textContent = item.title;
            element.querySelector("article .item-subtitle").textContent = item.preptime;
            element.querySelector("article .item-image").src = item.backgroundImage;
            element.querySelector("article .item-image").alt = item.shortTitle;
            // Display ingredients list
            var ingredients = element.querySelector("article .item-ingredients");
            for (var i = 0; i < item.ingredients.length; i++) {
                var ingredient = document.createElement("h2");
                ingredient.textContent = item.ingredients[i];
                ingredient.className = "ingredient";
                ingredients.appendChild(ingredient);
            }

            element.querySelector("article .item-directions").innerHTML = item.directions;
            element.querySelector(".content").focus();
            dtm.getForCurrentView().addEventListener("datarequested", this.onDataRequested);
            
            // Handle click events from the Photo command
            document.getElementById("photo").addEventListener("click", function (e) {
                var camera = new capture.CameraCaptureUI();

                // Capture a photo and display the share UI
                camera.captureFileAsync(capture.CameraCaptureUIMode.photo).then(function (file) {
                    if (file != null) {
                        _photo = file;
                        dtm.showShareUI();
                    }
                });
            });

            var button = document.getElementById("backButton");
            button.addEventListener("click", goBack);
        },
        onDataRequested: function (e) {
            var request = e.request;
            request.data.properties.title = item.title;
            
            // Share photo
            if (_photo != null) {
                request.data.properties.description = "Zdjęcie";
                var reference = storage.Streams.RandomAccessStreamReference.createFromFile(_photo);
                request.data.properties.Thumbnail = reference;
                request.data.setBitmap(reference);
                _photo = null;
            }
            else if (_video != null) {
                request.data.properties.description = "Video";
                request.data.setStorageItems([_video]);
                _video = null;
            }
            else {
                request.data.properties.description = "Składniki oraz sposób przygotowania";

                // Share recipe text
                var recipe = "\r\n[Składniki]\r\n" + item.ingredients.join("\r\n");
                recipe += ("\r\n\r\n[Sposób przygotowania]\r\n" + item.directions);
                request.data.setText(recipe);

                // Share recipe image
                var uri = item.backgroundImage;
                if (item.backgroundImage.indexOf("http://") != 0)
                    uri = "ms-appx:///" + uri;

                uri = new Windows.Foundation.Uri(uri);
                var reference = storage.Streams.RandomAccessStreamReference.createFromUri(uri);
                request.data.properties.thumbnail = reference;
                request.data.setBitmap(reference);
            }
        },
        unload: function () {
            WinJS.Navigation.removeEventListener("datarequested", this.onDataRequested);
        }
    });
    
    function goBack() {
        WinJS.Navigation.navigate("/pages/groupedItems/groupedItems.html");
    }

})();
