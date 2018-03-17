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
class mapGenerator {
    static getBlockText(x, y, z, xEast, ySouth, zTop, texture) {
        if(z === zTop) return '';
       return `\r\n{
\r\n( ${x} ${y} ${zTop} ) ( ${xEast} ${y} ${zTop} ) ( ${xEast} ${ySouth} ${zTop} ) ${texture} [ 1 0 0 32 ] [ 0 -1 0 0 ] 0 1 1 
\r\n( ${x} ${ySouth} ${z} ) ( ${xEast} ${ySouth} ${z} ) ( ${xEast} ${y} ${z} ) ${texture} [ 1 0 0 32 ] [ 0 -1 0 0 ] 0 1 1 
\r\n( ${x} ${y} ${zTop} ) ( ${x} ${ySouth} ${zTop} ) ( ${x} ${ySouth} ${z} ) ${texture} [ 0 1 0 0 ] [ 0 0 -1 176 ] 0 1 1 
\r\n( ${xEast} ${y} ${z} ) ( ${xEast} ${ySouth} ${z} ) ( ${xEast} ${ySouth} ${zTop} ) ${texture} [ 0 1 0 0 ] [ 0 0 -1 176 ] 0 1 1 
\r\n( ${xEast} ${y} ${zTop} ) ( ${x} ${y} ${zTop} ) ( ${x} ${y} ${z} ) ${texture} [ 1 0 0 32 ] [ 0 0 -1 176 ] 0 1 1 
\r\n( ${xEast} ${ySouth} ${z} ) ( ${x} ${ySouth} ${z} ) ( ${x} ${ySouth} ${zTop} ) ${texture} [ 1 0 0 32 ] [ 0 0 -1 176 ] 0 1 1 
\r\n}`
    }

    constructor(){
        this.blocks = {};
        this.coords = {};
    }

    //read picture RGB,returns [r,g,b,a]
    readPicture(p) {
        return new Promise((resolve, reject) => {
            getPixels(p, function (err, pixels) {
                if (err) {
                    reject("Bad image path");

                } else {
                    resolve(pixels)
                }
                console.log("got pixels", pixels.shape.slice());
                // console.log("got pixels", pixels.data);

            })
        })
    }
    makeMap(){
        let result = MAP_HEAD;
        let scale = 1;
        let tolerance = 16;
        for(let key in this.blocks){
            let item = this.blocks[key];
            let p = [item.left * scale,(item.top) * scale,(item.right) * scale,(item.bottom) * scale];
            let r = item.r;
            let g = item.g;
            let b = item.b;
            if(r>g && g>b){
                result += mapGenerator.getBlockText(p[0], p[1], g, p[2], p[3], r, 'LAB1_FLR7A');
                result += mapGenerator.getBlockText(p[0], p[1], 0, p[2], p[3], b, 'LAB5_W3B');
            }
            else if(r>g){
                result += mapGenerator.getBlockText(p[0], p[1], g, p[2], p[3], r, 'LAB5_W3');
            }

        }
        result += MAP_END;
        return result;
    }
    getMapFromPixels(pixels) {
        return new Promise((resolve, reject) => {
            for (let y = 0; y < pixels.shape[1]; y++) {
                for (let x = 0; x < pixels.shape[0]; x++) {
                    let pStart = (x + y * pixels.shape[0]) * pixels.shape[2];
                    //TODO rgb presents what?
                    let r = pixels.data[pStart];
                    let g = pixels.data[pStart + 1];
                    let b = pixels.data[pStart + 2];
                    this.blocks[`${x}-${y}`] = {
                        r:r,
                        g:g,
                        b:b,
                        blockType:`${r}-${g}-${b}`,
                        left:x,
                        right:x+1,
                        top:-y,
                        bottom: -y-1,
                        myId :`${x}-${y}`,
                        size:1
                    }
                    //result += this.getBlockText(x * scale, (-y) * scale, bottom, (x + 1) * scale, (-y - 1) * scale, height + 1, 'SKY');
                    // console.log()
                }
            }
            resolve();
        })

    }
    getCoord(name,value){
        return this.coords[name][value];
    }
    updateCoord(){
        console.log(`updateCoord:`,'start');
        let self = this;
        this.coords = {
            left:{},
            right:{},
            top:{},
            bottom:{},
        };
        function p(item,name){
            if(!self.coords[name][item[name]]){
                self.coords[name][item[name]] = [];
            }
            self.coords[name][item[name]].push(item.myId);
        }
        for(let key in this.blocks){
            let item = this.blocks[key];
            p(item,'left');
            // p(item,'right');
            p(item,'top');
            // p(item,'bottom');
        }
        console.log(`updateCoord :`,'end');
    }

    /**
     * return true if merge occur
     * @returns {boolean}
     * @param block
     */
    mergeCheck(block){
        //find nearBy with same color
        let nearByblock = {size:0};
        let limit = 4;
        let t = 0;
        let lefts = this.getCoord('left',block.left);
        let tops = this.getCoord('top',block.top);
        for(let i=0;i<lefts.length;i++){
            let item = this.blocks[lefts[i]];
            if(block.myId === item.myId) continue;
            if(item.blockType === block.blockType){
                if(item.right === block.right){
                    if(item.bottom === block.top || item.top === block.bottom){
                        if(t>=limit){
                            break;
                        }
                        t++;
                        if(item.size > nearByblock.size)
                            nearByblock = item;
                    }
                }
            }
        }
        for(let i=0;i<tops.length;i++){
            let item = this.blocks[tops[i]];
            if(block.myId === item.myId) continue;
            if(item.blockType === block.blockType){

                if(item.bottom === block.bottom){
                    if(item.left === block.right || item.right === block.left){
                        if(t>=limit){
                            break;
                        }
                        t++;
                        if(item.size > nearByblock.size)
                            nearByblock = item;
                    }
                }
            }
        }
        // for(let key in this.blocks){
        //     let item = this.blocks[key];
        //     if(item.blockType === block.blockType){
        //         // 1
        //         if(item.left === block.left && item.right === block.right){
        //             if(item.bottom === block.top || item.top === block.bottom){
        //                 if(t>=limit){
        //                     break;
        //                 }
        //                 t++;
        //                 if(item.size > nearByblock.size)
        //                     nearByblock = item;
        //             }
        //         }
        //         // 2
        //         if(item.top === block.top && item.bottom === block.bottom){
        //             if(item.left === block.right || item.right === block.left){
        //                 if(t>=limit){
        //                     break;
        //                 }
        //                 t++;
        //                 if(item.size > nearByblock.size)
        //                     nearByblock = item;
        //             }
        //         }
        //     }
        // }
        // console.log(`nearByblock :`,nearByblock);
        if(nearByblock.myId){
            this.merge(block,nearByblock);
            return true;
        } else {
            return false;
        }
        // merge the largest result .. or not
    }

    merge(b1,b2){
        // get left
        // kill both top and left

        for(let i=0;i<this.coords.left[b1.left].length;i++){
            let item=this.coords.left[b1.left][i];
            if(b1.myId === item){
                this.coords.left[b1.left].splice(i,1);
                break;
            }
        }
        for(let i=0;i<this.coords.left[b2.left].length;i++){
            let item=this.coords.left[b2.left][i];
            if(b2.myId === item){
                this.coords.left[b2.left].splice(i,1);
                break;
            }
        }
        for(let i=0;i<this.coords.top[b1.top].length;i++){
            let item=this.coords.top[b1.top][i];
            if(b1.myId === item){
                this.coords.top[b1.top].splice(i,1);
                break;
            }
        }
        for(let i=0;i<this.coords.top[b2.top].length;i++){
            let item=this.coords.top[b2.top][i];
            if(b2.myId === item){
                this.coords.top[b2.top].splice(i,1);
                break;
            }
        }
        b1.left = b1.left < b2.left ? b1.left : b2.left;
        b1.right = b1.right > b2.right ? b1.right : b2.right;
        b1.bottom = b1.bottom < b2.bottom ? b1.bottom : b2.bottom;
        b1.top = b1.top > b2.top ? b1.top : b2.top;
        b1.size += b2.size;
        delete this.blocks[b2.myId];
    }


    mergeAll(){
        //merge until impossible to merge
        return new Promise((resolve,reject)=>{

            let _mergeAll = ()=>{
                console.log('staring again!');
                let merged = false;
                let count = 0;
                let hintCount = 0;
                for(let key in this.blocks){
                    let item = this.blocks[key];
                    if(item){
                        let result = this.mergeCheck(item);
                        if(result){
                            count++;
                            merged = true;
                        }
                    }
                    hintCount++;
                    if(hintCount>5000){
                        console.log(`count :`,count);
                        hintCount=0;
                    }
                }
                if(merged){
                    console.log(`count :`,count);
                    this.updateCoord();
                    _mergeAll();
                } else {
                    resolve();
                }
            };
            _mergeAll();
        })
    }
}

// console.log(mapGenerator.getBlockText(0,32,0,128,-32,256,'SKY'));
let gen =new mapGenerator();
gen.readPicture(path.join(__dirname, 'level2.png')).then((pixels) => {
    return gen.getMapFromPixels(pixels);
}).then(() => {
    gen.updateCoord();
    return gen.mergeAll();
    // fs.writeFileSync(path.join(__dirname, 'sample.map'), data);
}).then(()=>{
    fs.writeFileSync(path.join(__dirname, 'sample.map'), gen.makeMap());
});