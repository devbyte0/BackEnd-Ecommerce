const SliderImages = require('../models/SliderImages')

exports.getAllSlides = async(req,res)=>{
    try {
        const sliderimages = await SliderImages.find();
        res.send(sliderimages)
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}


exports.getSingleSlide = async(req,res)=>{
    try {
        const id = req.params.id;
        const sliderimages = await SliderImages.findById(id)
        res.send(sliderimages)
        console.log(id)
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.putSingleSlide = async(req,res)=>{
    try {
        const id = req.params.id;

        const {name,price,brand} = req.body

        const trimmedName = name ? name.trim().toLowerCase() : null;

        const searchName = await SliderImages.findOne({name:trimmedName})

        const update = {}

        if(!searchName){
            if(name) update.name = name;
        }
        else{
            return res.status(404).json({message:` ${name} named product already exsists`})
        }
        
        if(price) update.price = price;
        
        if(brand) update.brand = brand;

        if(req.file) update.imageUrl = req.file.path;


        const sliderimages =  await SliderImages.findByIdAndUpdate(id,update,{new:true})

        if(!sliderimages){
          return  res.status(404).json({message:"No Product Found"})
        }

        const updatedsliderimages = await SliderImages.findById(id)
          
        res.send(updatedsliderimages)

        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.deleteSingleSlide = async(req,res)=>{
    try {
        const id = req.params.id;

        const sliderimages =  await SliderImages.findByIdAndDelete(id)

        if(!sliderimages){
           return res.status(404).json("No Product Found")
        }

        res.send("Deleted")

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};


exports.CreateSlides = async(req,res)=>{
    try {
        const {name,price,brand} = req.body

        const trimmedName = name ? name.trim().toLowerCase() : null;

        const searchName = await SliderImages.findOne({name:trimmedName})

        if(!searchName){
            const sliderimages = new SliderImages({
                name,
                price,
                brand,
                imageUrl: req.file.path,
            })
    
            await sliderimages.save();
    
            res.send(sliderimages)
        }
        else{
            return res.status(404).json({message:` ${name} named product already exsists`})
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}