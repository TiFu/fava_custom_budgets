export default {
    onExtensionPageLoad(ext: any) {
        console.log("Loaded extension - " + ext)
        console.log("Loaded extension - " + ext);
        console.log(ext)
        /*ext.api.get("budget", null).then((result) => {
            console.log(result)
        }).catch((e) => {
            console.log(e)
        })*/
    }
    }
}