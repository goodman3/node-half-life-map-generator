
const fs = require('fs');
const path = require('path');
const getPixels = require("get-pixels");
const MAP_HEAD = `{\r\n
"classname" "worldspawn"\r\n
"MaxRange" "32768"\r\n
"mapversion" "220"\r\n
"wad" ""`;
const MAP_END = `\r\n}
\r\n`;
class mapGenerator{
    /*
    {
( -224 -48 54 ) ( -224 128 54 ) ( 48 128 54 ) SKY [ 1 0 0 -16 ] [ 0 -1 0 0 ] 0 1 1
( -224 128 -16 ) ( -224 -48 -16 ) ( 48 -48 -16 ) SKY [ 1 0 0 -16 ] [ 0 -1 0 0 ] 0 1 1
( 48 128 -16 ) ( 48 -48 -16 ) ( 48 -48 54 ) SKY [ 0 1 0 0 ] [ 0 0 -1 -16 ] 0 1 1
( -224 -48 -16 ) ( -224 128 -16 ) ( -224 128 54 ) SKY [ 0 1 0 0 ] [ 0 0 -1 -16 ] 0 1 1
( 48 -48 -16 ) ( -224 -48 -16 ) ( -224 -48 54 ) SKY [ 1 0 0 -16 ] [ 0 0 -1 -16 ] 0 1 1
( -224 128 -16 ) ( 48 128 -16 ) ( 48 128 54 ) SKY [ 1 0 0 -16 ] [ 0 0 -1 -16 ] 0 1 1
}
     */
    static getBlockText(x,y,z,xEast,ySouth,zTop,texture){
        return `\r\n{
\r\n( ${x} ${y} ${zTop} ) ( ${xEast} ${y} ${zTop} ) ( ${xEast} ${ySouth} ${zTop} ) ${texture} [ 1 0 0 32 ] [ 0 -1 0 0 ] 0 1 1 
\r\n( ${x} ${ySouth} ${z} ) ( ${xEast} ${ySouth} ${z} ) ( ${xEast} ${y} ${z} ) ${texture} [ 1 0 0 32 ] [ 0 -1 0 0 ] 0 1 1 
\r\n( ${x} ${y} ${zTop} ) ( ${x} ${ySouth} ${zTop} ) ( ${x} ${ySouth} ${z} ) ${texture} [ 0 1 0 0 ] [ 0 0 -1 176 ] 0 1 1 
\r\n( ${xEast} ${y} ${z} ) ( ${xEast} ${ySouth} ${z} ) ( ${xEast} ${ySouth} ${zTop} ) ${texture} [ 0 1 0 0 ] [ 0 0 -1 176 ] 0 1 1 
\r\n( ${xEast} ${y} ${zTop} ) ( ${x} ${y} ${zTop} ) ( ${x} ${y} ${z} ) ${texture} [ 1 0 0 32 ] [ 0 0 -1 176 ] 0 1 1 
\r\n( ${xEast} ${ySouth} ${z} ) ( ${x} ${ySouth} ${z} ) ( ${x} ${ySouth} ${zTop} ) ${texture} [ 1 0 0 32 ] [ 0 0 -1 176 ] 0 1 1 
\r\n}`
    }

    //read picture RGB,returns [r,g,b,a]
    static readPicture(p){
        return new Promise((resolve,reject)=>{
    getPixels(p, function(err, pixels) {
        if(err) {
            reject("Bad image path");

        } else {resolve(pixels)}
        console.log("got pixels", pixels.shape.slice());
        // console.log("got pixels", pixels.data);

    })
})
    }

    static getMapFromPixels(pixels){
        let scale = 16;
        return new Promise((resolve,reject)=>{
            let result = MAP_HEAD;
            for(let y=0;y<pixels.shape[1];y++){
            for(let x=0;x<pixels.shape[0];x++){
                    let pStart = (x+y*pixels.shape[0])*pixels.shape[2];
                    //TODO rgb presents what?
                    let r=pixels.data[pStart];
                    let g=pixels.data[pStart+1];
                    let b=pixels.data[pStart+2];
                    let bottom = r < g? r : g-1;
                    let height = g;
                    result+=this.getBlockText(x*scale,(-y)*scale,bottom,(x+1)*scale,(-y-1)*scale,height+1,'SKY');
                    // console.log()
            }
            }
            result+=MAP_END;
            resolve(result);
        })

    }
}
// console.log(mapGenerator.getBlockText(0,32,0,128,-32,256,'SKY'));
mapGenerator.readPicture(path.join(__dirname,'level2.png')).then((pixels)=>{
return mapGenerator.getMapFromPixels(pixels);
}).then((data)=>{
    fs.writeFileSync(path.join(__dirname,'sample.map'),data);
});