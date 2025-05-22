// GirisCikisChart.tsx
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface Row {
    period: string; // YYYY-MM
    girisKg: number;
    cikisKg: number;
}

export default function GirisCikisChart() {
    /* -------- 1) Veriyi yükle (yerine API) -------------------------- */
    const [rows, setRows] = useState<Row[]>([]);

    useEffect(() => {
        // TODO: fetch('/api/...') ile gerçek veriyi çekip setRows(...) yapın
        setRows([
            { period: '2025-04', girisKg: 9805, cikisKg: 948 },
            { period: '2025-05', girisKg: 9845.25, cikisKg: 1184.25 },
        ]);
    }, []);

    /* -------- 2) Series -------------------------------------------------- */
    const series = [
        {
            name: 'Giriş (kg)',
            data: rows.map((r) => Number(r.girisKg.toFixed(2))),
        },
        {
            name: 'Çıkış (kg)',
            data: rows.map((r) => Number(r.cikisKg.toFixed(2))),
        },
    ];

    /* -------- 3) Opsiyonlar --------------------------------------------- */
    const options: ApexOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%', // çubuk kalınlığı
            },
        },
        stroke: { show: true, width: 1, colors: ['transparent'] },
        colors: ['#2196f3', '#e7515a'], // giriş = mavi, çıkış = kırmızı
        dataLabels: { enabled: false },
        xaxis: {
            categories: rows.map((r) => r.period),
            title: { text: 'Dönem' },
        },
        yaxis: {
            title: { text: 'kg' },
        },
        tooltip: {
            y: {
                formatter: (val) => `${val} kg`,
            },
        },
        legend: { position: 'bottom' },
    };

    /* -------- 4) JSX ----------------------------------------------------- */
    return (
        <div className="panel p-4">
            <h5 className="font-semibold text-lg mb-4 dark:text-white-light">Giriş / Çıkış Dengesi</h5>

            <ReactApexChart series={series} options={options} type="bar" height={350} className="bg-white dark:bg-black rounded-lg" />
        </div>
    );
}
