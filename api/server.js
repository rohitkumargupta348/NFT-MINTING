// Express is a node js web application framework that provides broad features for building web and mobile applications. 
// It is used to build a single page, multipage, and hybrid web application. It's a layer built on the top of the Node js 
// that helps manage servers and routes.
const express=require("express");
// Multer is a node. js middleware for handling multipart/form-data , which is primarily used for uploading files.
const multer=require("multer");
const cors=require("cors");
const axios=require("axios");
const app=express()
const port=process.env.PORT || 5000;

app.use(express.json())

const upload=multer({
    limits:{
        fileSize:1000000
    }
})

const starton = axios.create({
    baseURL:"https://api.starton.io/v3",
    headers:{
        "x-api-key":"sk_live_6a4760ea-32c1-418c-8c04-b48e03c10121",
    },
})

app.post('/upload',cors(),upload.single('file'),async(req,res)=>{
    let data=new FormData();
    const blob=new Blob([req.file.buffer],{type:req.file.mimetype});
    data.append("file",blob,{filename:req.file.originalnam})
    data.append("isSync","true");

    async function uploadImageOnIPFS(){
        const ipfsImage= await starton.post("/ipfs/file",data,{
            header:{"Content-Type":`multipart/form-data; boundary=${data._boundary}`},
        })
        return ipfsImage.data;
    }

    async function uploadMetaDataOnIPFS(imgCid){
        const metadataJson={
        name : `A wonderful NFT`,
        description : `Probably the most awesome NFT ever created !`,
        image : `ipfs://ipfs/${imgCid}`,
        }
        const ipfsMetadata=await starton.post("/ipfs/json",{
        name : `My NFT metadata Json`,
        content:metadataJson,
        isSync:true,
        })
        return ipfsMetadata.data;
    }

    const SMART_CONTRACT_NETWORK="polygon-mumbai"
    const SMART_CONTRACT_ADDRESS="0x1b84a184f471fD47FA477b97c5C8B716Ff3FEcE8"
    const WALLET_IMPORTED_ON_STARTON="0x18C479C4c4E600FbB9B91b41198E701F33010AB6";
    async function mintNFT(receiverAddress,metadataCid){
        const nft = await starton.post(`/smart-contract/${SMART_CONTRACT_NETWORK}/${SMART_CONTRACT_ADDRESS}/call`, {
            functionName: "mint",
            signerWallet: WALLET_IMPORTED_ON_STARTON,
            speed: "low",
            params: [receiverAddress, metadataCid],
        })
        return nft.data;
    }

    const RECEIVER_ADDRESS="0x1d6E7E2d696795f084D2063E5090B3393655C252"
    const ipfsImgData=await uploadImageOnIPFS();
    const ipfsMetaData=await uploadMetaDataOnIPFS(ipfsImgData.cid);
    const nft=await mintNFT(RECEIVER_ADDRESS,ipfsMetaData.cid)
    // console.log("Image Details",ipfsImgData);
    // console.log("Meta Data Details",ipfsMetaData);
    console.log(nft);
    res.status(201).json({
        transactionHash:nft.transactionHash,
        cid:ipfsImgData.cid
    })
})
app.listen(port,()=>{
    console.log("Server is running on port "+port);
})

// bafkreiawiocdzq662rnzieifqilhhrenli4im234zx5xpajvw4h6jopfsa.ipfs.dweb.link