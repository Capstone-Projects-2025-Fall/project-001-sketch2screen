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
                ${safeHtml}
                <p>worked</p>
            </div>
        </body>
    </html>`;


    return (outputString)
}