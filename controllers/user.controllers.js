const { PrismaClient } = require("@prisma/client");
const { supabase } = require("../utils/supabase");
const prisma = new PrismaClient();
const path = require("path");
const getUserById = async (req, res) => {
  const { user_id, rol_id } = req.query;

  if (!user_id || !rol_id) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  try {
    const id = parseInt(user_id, 10);
    const rol = parseInt(rol_id, 10);

    // Construir include dinámico
    let includeOptions = { rol: true };

    if (rol === 1) {
      includeOptions.Paciente = {
        include: {
          alergias: true, // relación de Paciente → Alergia
          enfermedades: true, // relación de Paciente → EnfermedadCronica
        },
      };
    } else if (rol === 2) {
      includeOptions.Personal = true; // relación de Usuario → Personal
    }

    const user = await prisma.usuario.findUnique({
      where: { id },
      include: includeOptions,
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Excluir la contraseña
    const { contraseña, ...userData } = user;

    return res.status(200).json({ user: userData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener usuario" });
  }
};

const actualizarUsuario = async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const user = await prisma.usuario.findUnique({
      where: { id: parseInt(usuario_id, 10) },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    let updateData = { ...req.body };

    if (req.file) {
      const fileExt = path.extname(req.file.originalname);
      const fileName = `user_${usuario_id}${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("Profile-Images")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ error: "Error al subir imagen" });
      }

      const { data } = supabase.storage
        .from("Profile-Images")
        .getPublicUrl(fileName);

      updateData.foto_url = data.publicUrl;
    }

    const updateUser = await prisma.usuario.update({
      where: { id: parseInt(usuario_id, 10) },
      data: updateData,
    });

    return res.status(200).json({ message: "Usuario Actualizado",  user: updateUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al actualizar usuario" });
  }
};


module.exports = {
  actualizarUsuario,
  getUserById,
};
