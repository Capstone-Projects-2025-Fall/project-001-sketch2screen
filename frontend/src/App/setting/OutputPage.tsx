export function OutputPage(safeHtml: string) {

    
    var outputString: string = `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src=""></script>
        </head>
        <body>
            <div class="content">
                <div class="generated-content">
                ${safeHtml}
                </div>
            </div>
            <script>
                var items = document.querySelectorAll('.generated-content');
                items.forEach(item => {item.addEventListener('click',()=>{item.style.outline = '2px dashed blue'})})
            </script>
        </body>
    </html>`;


    return (outputString)
}