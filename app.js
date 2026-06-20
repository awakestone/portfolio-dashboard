let equityChart=null;
const API_KEY = "d8rbcepr01qni6thkqcgd8rbcepr01qni6thkqd0";

const holdings = [

{symbol:"TQQQ",shares:630,cost:28.01,group:"Leveraged"},
{symbol:"NVDA",shares:318,cost:69.99,group:"AI"},
{symbol:"MSFT",shares:88,cost:283.56,group:"AI"},
{symbol:"TSM",shares:61,cost:178.60,group:"AI"},
{symbol:"QQQ",shares:38,cost:278.70,group:"Tech"},
{symbol:"TLT",shares:209,cost:93.88,group:"Bond"},
{symbol:"AMZN",shares:29,cost:260.65,group:"AI"},
{symbol:"META",shares:12,cost:334.38,group:"AI"},
{symbol:"TMF",shares:161,cost:56.62,group:"Leveraged"},
{symbol:"UPRO",shares:30,cost:63.00,group:"Leveraged"},
{symbol:"SGOV",shares:40,cost:100.47,group:"Cash"},
{symbol:"TSLA",shares:2,cost:225.38,group:"Other"}

];

let pieChart = null;
let allocationChart = null;

async function getUSDCNY(){

    try{

        const r =
        await fetch(
        "https://open.er-api.com/v6/latest/USD"
        );

        const data = await r.json();

        return data.rates.CNY;

    }catch{

        return 7.2;

    }

}
function savePortfolioHistory(totalValue){

    const today =
    new Date()
    .toISOString()
    .split("T")[0];

    let history =
    JSON.parse(
    localStorage.getItem(
    "portfolioHistory"
    ) || "[]"
    );

    const existing =
    history.find(
    x=>x.date===today
    );

    if(existing){

        existing.value =
        totalValue;

    }else{

        history.push({

            date:today,

            value:totalValue

        });

    }

    history=
    history.slice(-365);

    localStorage.setItem(
    "portfolioHistory",
    JSON.stringify(history)
    );

    return history;
}
async function loadPortfolio(){

    const tbody =
    document.getElementById(
    "portfolioBody"
    );

    tbody.innerHTML="";

    let totalValue=0;
    let totalCost=0;
    let totalPnl=0;

    let aiValue=0;
    let leveragedValue=0;
    let bondValue=0;
    let cashValue=0;

    const positions=[];

    const results =
    await Promise.all(

        holdings.map(async h=>{

            try{

                const r =
                await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${h.symbol}&token=${API_KEY}`
                );

                const data =
                await r.json();

                return {
                    holding:h,
                    price:Number(data.c)
                };

            }catch{

                return {
                    holding:h,
                    price:0
                };

            }

        })

    );

    results.forEach(item=>{

        const h=item.holding;
        const price=item.price;

        if(price<=0) return;

        const marketValue=
        price*h.shares;

        const costValue=
        h.cost*h.shares;

        const pnl=
        marketValue-costValue;

        const returnPct=
        ((price-h.cost)/h.cost)*100;

        totalValue+=marketValue;
        totalCost+=costValue;
        totalPnl+=pnl;

        positions.push({
            symbol:h.symbol,
            value:marketValue
        });

        if(h.group==="AI")
            aiValue+=marketValue;

        if(h.group==="Leveraged")
            leveragedValue+=marketValue;

        if(h.group==="Bond")
            bondValue+=marketValue;

        if(h.group==="Cash")
            cashValue+=marketValue;

        item.marketValue=marketValue;
        item.pnl=pnl;
        item.returnPct=returnPct;

    });

    positions.sort(
    (a,b)=>b.value-a.value
    );

    results.sort(
    (a,b)=>
    (b.marketValue||0)-
    (a.marketValue||0)
    );

    results.forEach(item=>{

        if(!item.marketValue) return;

        const weight=
        item.marketValue/
        totalValue*100;

        const tr=
        document.createElement("tr");

        tr.innerHTML=`

        <td>${item.holding.symbol}</td>

        <td>${item.holding.shares}</td>

        <td>${item.holding.cost.toFixed(2)}</td>

        <td>${item.price.toFixed(2)}</td>

        <td class="${
        item.returnPct>=0
        ?"positive"
        :"negative"
        }">

        ${item.returnPct.toFixed(1)}%

        </td>

        <td>
        $${item.marketValue.toLocaleString()}
        </td>

        <td class="${
        item.pnl>=0
        ?"positive"
        :"negative"
        }">

        $${item.pnl.toLocaleString()}

        </td>

        <td>
        ${weight.toFixed(2)}%
        </td>

        `;

        tbody.appendChild(tr);

    });

    const usdCny =
    await getUSDCNY();

    document.getElementById(
    "totalUsd"
    ).innerHTML=
    "$"+
    totalValue.toLocaleString(
    undefined,
    {maximumFractionDigits:0}
    );

    document.getElementById(
    "totalCny"
    ).innerHTML=
    "¥"+
    (totalValue*usdCny)
    .toLocaleString(
    undefined,
    {maximumFractionDigits:0}
    );

    document.getElementById(
    "totalPnl"
    ).innerHTML=
    "$"+
    totalPnl.toLocaleString(
    undefined,
    {maximumFractionDigits:0}
    );

    document.getElementById(
    "totalReturn"
    ).innerHTML=
    (
    totalPnl/
    totalCost*
    100
    ).toFixed(2)+"%";

    document.getElementById(
    "aiWeight"
    ).innerHTML=
    (
    aiValue/
    totalValue*
    100
    ).toFixed(1)+"%";

    document.getElementById(
    "leveragedWeight"
    ).innerHTML=
    (
    leveragedValue/
    totalValue*
    100
    ).toFixed(1)+"%";

    document.getElementById(
    "bondWeight"
    ).innerHTML=
    (
    bondValue/
    totalValue*
    100
    ).toFixed(1)+"%";

    document.getElementById(
    "cashWeight"
    ).innerHTML=
    (
    cashValue/
    totalValue*
    100
    ).toFixed(1)+"%";
    const history =
savePortfolioHistory(
totalValue
);

const peak =
Math.max(
...history.map(
x=>x.value
)
);

const drawdown =
(
(totalValue-peak)
/peak
*100
);

document.getElementById(
"peakValue"
).innerHTML=
"$"+
peak.toLocaleString(
undefined,
{
maximumFractionDigits:0
}
);

document.getElementById(
"drawdown"
).innerHTML=
drawdown.toFixed(2)
+"%";

if(drawdown<0){

document.getElementById(
"drawdown"
).className=
"value negative";

}

    let riskScore=0;

if(nvdaWeight>30)
riskScore+=3;

if(
leveragedValue/
totalValue>0.25
)
riskScore+=3;

if(
bondValue/
totalValue>0.20
)
riskScore+=2;

if(
aiValue/
totalValue>0.50
)
riskScore+=2;

document.getElementById(
"riskScore"
).innerHTML=
riskScore+"/10";

if(equityChart)
equityChart.destroy();

equityChart=
new Chart(
document.getElementById(
"equityCurve"
),
{
type:"line",

data:{

labels:
history.map(
x=>x.date
),

datasets:[
{
label:"Portfolio",

data:
history.map(
x=>x.value
)
}
]
}

});
    
    const largest=
    positions[0];

    document.getElementById(
    "largestPosition"
    ).innerHTML=
    "最大持仓："+largest.symbol;

    const nvda=
    positions.find(
    x=>x.symbol==="NVDA"
    );

    const nvdaWeight=
    nvda.value/
    totalValue*
    100;

    document.getElementById(
    "nvdaExposure"
    ).innerHTML=
    "NVDA占比："+nvdaWeight.toFixed(1)+"%";

    let alerts=[];

    if(nvdaWeight>35)
        alerts.push(
        "⚠ NVDA仓位超过35%"
        );

    if(
    leveragedValue/
    totalValue>0.4
    )
        alerts.push(
        "⚠ 杠杆仓位超过40%"
        );

    if(
    bondValue/
    totalValue>0.3
    )
        alerts.push(
        "⚠ 利率暴露过高"
        );

    document.getElementById(
    "riskAlerts"
    ).innerHTML=
    alerts.join("<br>");

    if(pieChart)
        pieChart.destroy();

    pieChart=
    new Chart(
    document.getElementById(
    "pieChart"
    ),
    {
        type:"pie",
        data:{
            labels:
            positions.map(
            x=>x.symbol
            ),
            datasets:[
            {
                data:
                positions.map(
                x=>x.value
                )
            }]
        }
    });

    if(allocationChart)
        allocationChart.destroy();

    allocationChart=
    new Chart(
    document.getElementById(
    "allocationChart"
    ),
    {
        type:"doughnut",
        data:{
            labels:[
            "AI",
            "Leveraged",
            "Bond",
            "Cash"
            ],
            datasets:[
            {
                data:[
                aiValue,
                leveragedValue,
                bondValue,
                cashValue
                ]
            }]
        }
    });

}

loadPortfolio();

setInterval(
loadPortfolio,
60000
);
