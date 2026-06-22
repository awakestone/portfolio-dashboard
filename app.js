const API_KEY = "d8rl8t1r01qnkitod980d8rl8t1r01qnkitod98g";

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

function formatMoney(value){
    return value.toLocaleString(
        undefined,
        {
            minimumFractionDigits:2,
            maximumFractionDigits:2
        }
    );
}

async function getUSDCNY(){

    try{

        const r =
        await fetch(
            "https://open.er-api.com/v6/latest/USD"
        );

        const data = await r.json();

        return data.rates.CNY;

    }catch{

        return 7.20;

    }

}

async function loadPortfolio(){

    const tbody =
    document.getElementById("portfolioBody");

    tbody.innerHTML = "";

    let totalValue = 0;
    let totalCost = 0;
    let totalPnl = 0;

    let aiValue = 0;
    let leveragedValue = 0;
    let bondValue = 0;
    let cashValue = 0;

    const positions = [];

    const results = await Promise.all(

        holdings.map(async h => {

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

        const h = item.holding;
        const price = item.price;

        if(price <= 0) return;

        const marketValue =
        price * h.shares;

        const costValue =
        h.cost * h.shares;

        const pnl =
        marketValue - costValue;

        const returnPct =
        ((price - h.cost) / h.cost) * 100;

        totalValue += marketValue;
        totalCost += costValue;
        totalPnl += pnl;

        positions.push({
            symbol:h.symbol,
            value:marketValue
        });

        if(h.group==="AI")
            aiValue += marketValue;

        if(h.group==="Leveraged")
            leveragedValue += marketValue;

        if(h.group==="Bond")
            bondValue += marketValue;

        if(h.group==="Cash")
            cashValue += marketValue;

        item.marketValue = marketValue;
        item.pnl = pnl;
        item.returnPct = returnPct;

    });

    if(positions.length === 0){
        return;
    }

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

        const weight =
        item.marketValue /
        totalValue * 100;

        const tr =
        document.createElement("tr");

        tr.innerHTML = `

        <td>${item.holding.symbol}</td>

        <td>${item.holding.shares}</td>

        <td>${item.holding.cost.toFixed(2)}</td>

        <td>${item.price.toFixed(2)}</td>

        <td class="${
        item.returnPct>=0
        ?"positive"
        :"negative"
        }">
        ${item.returnPct.toFixed(2)}%
        </td>

        <td>
        $${formatMoney(item.marketValue)}
        </td>

        <td class="${
        item.pnl>=0
        ?"positive"
        :"negative"
        }">
        $${formatMoney(item.pnl)}
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
    ).innerHTML =
    "$" + formatMoney(totalValue);

    document.getElementById(
    "totalCny"
    ).innerHTML =
    "¥" + formatMoney(totalValue * usdCny);

    document.getElementById(
    "totalPnl"
    ).innerHTML =
    "$" + formatMoney(totalPnl);

    document.getElementById(
    "totalReturn"
    ).innerHTML =
    (
        totalPnl /
        totalCost *
        100
    ).toFixed(2) + "%";

    document.getElementById(
    "aiWeight"
    ).innerHTML =
    (
        aiValue /
        totalValue *
        100
    ).toFixed(2) + "%";

    document.getElementById(
    "leveragedWeight"
    ).innerHTML =
    (
        leveragedValue /
        totalValue *
        100
    ).toFixed(2) + "%";

    document.getElementById(
    "bondWeight"
    ).innerHTML =
    (
        bondValue /
        totalValue *
        100
    ).toFixed(2) + "%";

    document.getElementById(
    "cashWeight"
    ).innerHTML =
    (
        cashValue /
        totalValue *
        100
    ).toFixed(2) + "%";

    const largest =
    positions[0];

    document.getElementById(
    "largestPosition"
    ).innerHTML =
    "最大持仓：" + largest.symbol;

    const nvda =
    positions.find(
        x=>x.symbol==="NVDA"
    );

    const nvdaWeight =
    nvda
    ? nvda.value / totalValue * 100
    : 0;

    document.getElementById(
    "nvdaExposure"
    ).innerHTML =
    "NVDA占比：" +
    nvdaWeight.toFixed(2) + "%";

    let alerts = [];

    if(nvdaWeight > 35)
        alerts.push(
        "⚠ NVDA仓位超过35%"
        );

    if(
        leveragedValue /
        totalValue > 0.40
    )
        alerts.push(
        "⚠ 杠杆仓位超过40%"
        );

    if(
        bondValue /
        totalValue > 0.30
    )
        alerts.push(
        "⚠ 利率暴露过高"
        );

    document.getElementById(
    "riskAlerts"
    ).innerHTML =
    alerts.length
    ? alerts.join("<br>")
    : "暂无风险警报";

    if(pieChart)
        pieChart.destroy();

    pieChart =
    new Chart(
        document.getElementById("pieChart"),
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
            },
            options:{
                responsive:true,
                maintainAspectRatio:false
            }
        }
    );

    if(allocationChart)
        allocationChart.destroy();

    allocationChart =
    new Chart(
        document.getElementById("allocationChart"),
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
            },
            options:{
                responsive:true,
                maintainAspectRatio:false
            }
        }
    );

}

loadPortfolio();

setInterval(
    loadPortfolio,
    60000
);
```
