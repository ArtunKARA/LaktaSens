const express = require("express");
const router = express.Router();

const {
    postStokListesi,
    postHayvanSayisi,
    postHayvanYemIhtiyac,

    postStokEgilimi,
    postNetTuketim,
    postStokDagilim,
    postGirisCikis,
    postTuketimNeden,
    postKpiKgInekGun,
    postBesinOran
} = require("../../../controllers/çiftçi/yem/yem-hesaplama-controller");

router.post("/postStokListesi",postStokListesi);

router.post("/postHayvanSayisi",postHayvanSayisi);
router.post("/postHayvanYemIhtiyac",postHayvanYemIhtiyac);

router.post("/postStokEgilimi",postStokEgilimi);
router.post("/postNetTuketim",postNetTuketim);
router.post("/postStokDagilim",postStokDagilim);
router.post("/postGirisCikis",postGirisCikis);  
router.post("/postTuketimNeden",postTuketimNeden);
router.post("/postKpiKgInekGun",postKpiKgInekGun);
router.post("/postBesinOran",postBesinOran);





module.exports = router;    