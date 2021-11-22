const urlstart = "https://getir.com/yemek/restoran/";
var ycomponent = document.getElementById("topyazi");
var htm = null
var url = "";
var ar = [];
const genel = document.querySelector("#genel");
/**
 * display a product parsed with parseGetirList()
 * @param {[String,Number]} par 
 * @returns 
 */
function pairtoString(par){
  let a = par[0];
  let b = par[1];
  return `${a} - ${b.toFixed(2)}₺`
}
/**
 * Removes duplicates in an array
 * BAD IMPLEMENTATION BUT WHATEVER
 * @param {Array} ar array to remove duplicates from
 * @param {Array} gar array of products parsed with parseGetirList()
 * @param {Number} max just leave empty
 * @returns {Array} edited ar
 */
function remdouble(ar,gar,max){
  if(!max) max = ar.length;
    let rt = ar.slice(0,Math.min(ar.length,max));
    let a = 0;
    for(let i = 0;i<Math.min(max,ar.length) - 1;i++){
      for(let  j= i+1;j<Math.min(max,ar.length);j++){
      let f = true;
      for(let k = 1; k <  ar[i].length; k++){
        if(gar[ar[i][k]][0] != gar[ar[j][k]][0]){
          f = false;
          break;
        }
      }
      if(f){
        // console.log(ar[i],ar[j]);
        // console.log(rt.length);
        rt.splice(i + a,1);
        a --;
        break;
      }
    }
  }
    return rt;
}
//Upon click
document.addEventListener("click", function(e) {
    if (e.target.id != "message") {
      return;
    }
    if(ar.length == 0) return;
    if(url == "") return;
    //If user clicked to the button and user is in the right page
    ycomponent.innerHTML = "Lütfen bekleyin"
    let min = Number(document.querySelector("#minput").value);
    let max = Number(document.querySelector("#maxput").value);
    if(min == NaN || max == NaN) return;
    //0<min <= max
    if(min > max || min < 0 || max <= 0){
      ycomponent.innerText = "Lütfen geçerli bir fiyat aralığı seçin."
      return;
    }
    var children = Array.prototype.slice.call(genel.children);
    // console.log(children)
    let flag = false;
    //clear previous search results (if any) first
    for(i in children){
      console.log(children[i].id)
      // console.log(flag)
      if(flag){
        children[i].remove();
      }
      if(children[i].id == "message") flag = true;
    }

    let itls = [];
    //get combinations
    for (let index = 1; index < 7; index++) {
      console.log(index);
      itls= itls.concat(remdouble(get_results(min,max,ar,index),ar));
      if (itls.length > 25) break;
      
    }
    
    itls.sort((a,b) => a[0] - b[0]) //sort
    ycomponent.innerHTML="Ekonomik Getir";
    //create DOM elements and append to general body
    for(let i = 0;i<Math.min(100,itls.length);i++){
      let a = document.createElement('div');
      a.className = "bigbox";
      genel.appendChild(a);
      let b = document.createElement('div');
      b.className = "sec"
      b.innerText = "Toplam: " + itls[i][0].toFixed(2) + "₺";
      a.appendChild(b);
      for(let j = itls[i].length -1;j>0;j--){
        let p = document.createElement('div');
        p.className = "sec"
        // console.log(ar[itls[i][p]])
        p.innerText = pairtoString(ar[itls[i][j]]);
        a.appendChild(p);
      }
      //ANIMATE
      a.animate([
        // keyframes
        { transform: `translateY(${300 + (i*20)}px)` },
        { transform: 'translateY(0px)' }
      ], {
        // timing options
        duration: 130 + (i*40),
        iterations: 1
      });
    }
    // ycomponent.innerText = ar[0];
  });



/**
 * gets combinations
 * @param {Number} min min price 
 * @param {Number} max max price
 * @param {Array} ar array of products each element ["product-name",price]
 * @param {Number} maxrs number of products in one combination
 * 
 * @returns {Array} array, each elements is in [total_price,product1_index,product2_index...]
 */
function get_results(min,max,ar,maxrs){
    let gl = [];
    let st = 0;
    while(st < ar.length && ar[st][1] > max){
      st += 1;
    }
    /**
     * Recursively makes combinations and appends to gl
     * @param {Number} min 
     * @param {Number} max 
     * @param {Array} ar 
     * @param {Number} rs step number
     * @param {Number} st starting index of array
     * @param {Number} add total price so far
     * @param {Array} prev array of previous step
     */
    function get_do(min,max,ar,rs,st,add,prev){
      while(st < ar.length && add + ar[st][1] > max){
        st += 1;
      }
      if(st > ar.length || rs == 0 || add == max){
        if (add < min) return;
        if(prev.length != maxrs) return;
        prev.push(add)
        gl.push(prev.slice().reverse())
        prev.pop()
        return;
      }
      for(let i = st;i<ar.length;i++){
        let na = add + ar[i][1]
        if(na <= max){
          prev.push(i)
          get_do(min,max,ar,rs-1,i,na,prev)
          prev.pop()
        }
      }
    }
    get_do(min,max,ar,maxrs,0,0,[])
    return gl;
}



/**
 * once the source returned, parses the html
 */
chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
      htm = request.source;
      ar = parseGetirList(htm);
      let mp = getMinPrice(htm);
      // console.log(mp);
      document.querySelector("#minput").value = mp;
      document.querySelector("#maxput").value = mp + 5;
      ycomponent.innerHTML= "Ekonomik Getir"
    //   message.innerText = ar[0]
    //   for(i in ar){
    //       const e = document.createElement('div');
    //       e.classList.add("clickme");
    //       e.innerText = ar[i][0] + "\t" + ar[i][1];
    //       genel.append(e);
    //   }
    }
  });
  /**
   * runs when popup is open,
   * checks if the user is in restaurant page,
   * if so injects a js to get the page source html
   * 
   */
  async function onWindowLoad() {
    await chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        url = tabs[0].url;
    
        if (url.slice(0,urlstart.length) != urlstart){
            ycomponent.innerHTML = "Bir getir yemek restoran sayfasında değilsin!";
            var children = Array.prototype.slice.call(genel.children);
            // console.log(children)
            children.forEach(element => {
                if(element.id != "topyazi") element.remove();
            });
            return;
        }
        // ycomponent.innerHTML = "Bir getir yemek restoran sayfasındasın";
        
        // use `url` here inside the callback because it's asynchronous!

        if (url.slice(0,urlstart.length) != urlstart){
            return;
        }
        var message = document.querySelector('#message');
      
        chrome.tabs.executeScript(null, {
          file: "getPagesSource.js"
        }, function() {
          // If you try and inject into an extensions page or the webstore/NTP you'll get an error
          if (chrome.runtime.lastError) {
            message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
          }
        });
    });

  
  }
  
window.onload = onWindowLoad;
  
/**
 * parses the page html and returns the minimum shipping price, 
 * Müdavim indirimi varsa dahil eder
 * @param {String} text html of the page 
 * @returns 
 */
function getMinPrice(text){
  let a1 = text.indexOf("</style>");
    if(a1 == -1) return 0;
    a1 += 2;
    a1 = text.indexOf("Min.",a1);
    if(a1 == -1) return 0;
    console.log(a1);
    a1 += 1;
    a1 = text.indexOf("₺",a1)+1;
    let a2 = text.indexOf("<",a1);
    console.log(text.slice(a1,a2));
    let t1 = parseFloat(text.slice(a1,a2).replace(",","."));
    a1 = text.indexOf("Müdavim +") + 1;
    if(a1 == -1) return t1;
    a2 = text.indexOf("TL", a1);
    if(a2 == -1) return t1;
    console.log(text.slice(a1 + "Müdavim +".length,a2))
    let t2 = parseFloat(text.slice(a1 + "Müdavim +".length,a2).replace(",","."))
    console.log(t2);
    if(!t2) return t1;
    // console.log(t1);
    // console.log(t2);
    return t1 + t2;
}


/**
 * Parse HTML to get product list
 * @param {string} text page source html as string
 * @returns {Array} array each element as ["product name":str,price:number]
 */
function parseGetirList(text){
    let ar = [];
    let a1 = text.indexOf("</style>");
    if(a1 == -1) return ar;
    a1 += 2;
    a1 = text.indexOf("</style>",a1);
    a1 += 8;
    const trimmed = text.slice(a1);
    a1 = trimmed.indexOf("FoodName-sc");
    if(a1 == -1) return ar;
    let a2 = trimmed.indexOf(">",a1);
    if(a2 == -1) return ar;
    while(a2 >= 0){
        let flag = true;
        a1 = trimmed.indexOf("<",a2);
        if(a1 == -1) break;
        let q1 = trimmed.slice(a2+1,a1).replace('&amp;','&');
        if(q1 == "Poşet"){
            flag = false;
        }
        a1 = trimmed.indexOf("PriceText-sc",a1 +1);
        if(a1 == -1) break;
        a2 = trimmed.indexOf(">",a1);
        if(a2 == -1) break;
        a1 = trimmed.indexOf("<",a2);
        if(a1 == -1) break;
        let q2 = Number(trimmed.slice(a2+2,a1).replace(',','.'));
        if (flag) ar.push([q1,q2])

        a1 = trimmed.indexOf("FoodName-sc",a1 +1);
        if(a1 == -1) break;
        a2 = trimmed.indexOf(">",a1);
        if(a2 == -1) break;
    }
    ar.sort((a,b)=>-a[1] + b[1])
    console.log(ar)
    return ar;
}

