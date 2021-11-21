const urlstart = "https://getir.com/yemek/restoran/";
var ycomponent = document.getElementById("topyazi");
var htm = null
var url = "";
var ar = [];
const genel = document.querySelector("#genel");

function pairtoString(par){
  let a = par[0];
  let b = par[1];
  return `${a} - ${b.toFixed(2)}₺`
}

document.addEventListener("click", function(e) {
    if (e.target.id != "message") {
      return;
    }
    if(ar.length == 0) return;
    if(url == "") return;
    ycomponent.innerHTML = "Lütfen bekleyin"
    let min = Number(document.querySelector("#minput").value);
    let max = Number(document.querySelector("#maxput").value);
    if(min == NaN || max == NaN) return;
    var children = Array.prototype.slice.call(genel.children);
    // console.log(children)
    let flag = false;
    for(i in children){
      console.log(children[i].id)
      // console.log(flag)
      if(flag){
        children[i].remove();
      }
      if(children[i].id == "message") flag = true;
    }
    if(min > max || min < 0 || max <= 0){
        ycomponent.innerText = "Lütfen geçerli bir fiyat aralığı seçin."
        return;
    }
    let itls = [];
    for (let index = 1; index < 7; index++) {
      console.log(index);
      itls= itls.concat(get_results(min,max,ar,index));
      if (itls.length > 25) break;
      
    }
    //itls.reverse()
    itls.sort((a,b) => a[0] - b[0]/*- ((a.length - b.length)*(1-Math.abs(Math.sign(b[0] - a[0]))))*/)
    //ycomponent.innerText = itls[0] ;
    ycomponent.innerHTML="";
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
    return gl;
}




chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
      htm = request.source;
      ar = parseGetirList(htm);
      let mp = getMinPrice(htm);
      // console.log(mp);
      document.querySelector("#minput").value = mp;
      document.querySelector("#maxput").value = mp + 5;
      ycomponent.innerHTML= "Butona basarak minimum fiyata en yakın kombinasyonları görebilirsiniz."
    //   message.innerText = ar[0]
    //   for(i in ar){
    //       const e = document.createElement('div');
    //       e.classList.add("clickme");
    //       e.innerText = ar[i][0] + "\t" + ar[i][1];
    //       genel.append(e);
    //   }
    }
  });
  
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

