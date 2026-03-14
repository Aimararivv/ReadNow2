import pool from '../config/db.js';
import crypto from "crypto";

const algorithm = "aes-256-cbc";

const key = crypto.createHash('sha256')
  .update(process.env.CARD_SECRET || "clave_super_segura_32_chars")
  .digest();

function encrypt(text){
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text.toString(), "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
}

// 🔹 ocultar tarjeta
function maskCardNumber(card){
    const clean = card.replace(/\s/g,'');
    const last4 = clean.slice(-4);

    return "**** **** **** " + last4;
}

export const updateRole = async (req,res)=>{

    const { role, cardYear, cardNumber, cvv } = req.body;
    const { id } = req.params;

    try{

        let encryptedYear = null;
        let maskedCard = null;

        if(cardYear){
            encryptedYear = encrypt(cardYear);
        }

        if(cardNumber){
            maskedCard = maskCardNumber(cardNumber);
        }

        const result = await pool.query(
        `UPDATE usuarios
         SET role=$1,
             card_year_encrypted=$2,
             card_number_masked=$3,
             card_cvv=$4
         WHERE id_usuario=$5
         RETURNING id_usuario,nombre,correo,role`,
        [role, encryptedYear, maskedCard, cvv, id]
        );

        res.json({
            message:"Rol actualizado",
            user: result.rows[0]
        });

    }catch(error){
        console.error(error);
        res.status(500).json({error:"Error actualizando rol"});
    }

}