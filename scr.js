const urlstart = "https://getir.com/yemek/restoran/";
var ycomponent = document.getElementById("otzbir");
var htm = null
var url = "";
var ar = [];
document.addEventListener("click", function(e) {
    if (e.target.id != "message") {
      return;
    }
    if(ar.length == 0) return;
    if(url == "") return;
    let min = Number(document.querySelector("#minput").value);
    let max = Number(document.querySelector("#maxput").value);
    if(min == NaN || max == NaN) return;
    if(min > max || min < 0 || max <= 0){
        ycomponent.innerText = "Lütfen geçerli bir fiyat aralığı seçin." + (min > max).toString() + " " + (min).toString() + " " + (max).toString()
        return;
    }
    let itls = get_results(min,max,ar,3);
    //ycomponent.innerText = itls[0] ;
    for(let i = 0;i<Math.min(20,itls.length);i++){
      let a = document.createElement('hr');
      document.body.appendChild(a);
      let b = document.createElement('div');
      b.className = "clickme"
      b.innerText = itls[i][0].toString() + " ₺";
      document.body.appendChild(b);
      for(let j = 1;j<itls[i].length;j++){
        let p = document.createElement('div');
        p.className = "clickme"
        // console.log(ar[itls[i][p]])
        p.innerText = ar[itls[i][j]];
        document.body.appendChild(p);
      }
    }
    // ycomponent.innerText = ar[0];
  });



/**
 * 
 * @param {Number} min 
 * @param {Number} max 
 * @param {Array} ar 
 * @param {Number} maxrs 
 * 
 * @returns {Array}
 */
function get_results(min,max,ar,maxrs){
    let gl = [];
    let st = 0;
    while(st < ar.length && ar[st][1] > max){
      st += 1;
    }
    /**
     * 
     * @param {*} min 
     * @param {*} max 
     * @param {*} ar 
     * @param {*} rs 
     * @param {*} st 
     * @param {*} add 
     * @param {Array} prev 
     */
    function get_do(min,max,ar,rs,st,add,prev){
      while(st < ar.length && add + ar[st][1] > max){
        st += 1;
      }
      if(st > ar.length || rs == 0 || add == max){
        if (add < min) return;
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
    gl.sort((a,b) => a[0] - b[0]/*- ((a.length - b.length)*(1-Math.abs(Math.sign(b[0] - a[0]))))*/)
    return gl;
}




chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
      htm = request.source;
      ar = parseGetirList(htm)
    //   message.innerText = ar[0]
    //   for(i in ar){
    //       const e = document.createElement('div');
    //       e.classList.add("clickme");
    //       e.innerText = ar[i][0] + "\t" + ar[i][1];
    //       document.body.append(e);
    //   }
    }
  });
  
  async function onWindowLoad() {
    await chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        url = tabs[0].url;
    
        if (url.slice(0,urlstart.length) != urlstart){
            ycomponent.innerHTML = "Bir getir yemek restoran sayfasında değilsin!";
            var children = Array.prototype.slice.call(document.body.children);
            console.log(children)
            children.forEach(element => {
                if(element.id != "otzbir") element.remove();
            });
            return;
        }
        ycomponent.innerHTML = "Bir getir yemek restoran sayfasındasın";
        
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
 * 
 * @param {string} text
 * @returns {Array} 
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
        let q1 = trimmed.slice(a2+1,a1)
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

