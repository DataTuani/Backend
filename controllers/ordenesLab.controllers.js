const { PrismaClient } = require("@prisma/client");
const { supabase } = require("../utils/supabase");
const prisma = new PrismaClient();
const path = require("path");

const obtenerOrdenesLabPorId = async (req, res) => {
  const { user_id } = req.params;

  try {
    const id = parseInt(user_id, 10);

    const ordenes = await prisma.ordenLaboratorio.findMany({
      where: {
        consulta: {
          expediente: {
            paciente: {
              usuario_id: id,
            },
          },
        },
      },
      select: {
        id: true,
        instrucciones: true,
        tipo_examen: true,
        resultado_url: true,

        created_at: true,
        expediente: {
          select: {
            paciente: {
              select: {
                grupo_sanguineo: true,
                usuario: {
                  select: {
                    primer_nombre: true,
                    segundo_nombre: true,
                    primer_apellido: true,
                    segundo_apellido: true,
                    cedula: true,
                    fecha_nacimiento: true,
                  },
                },
              },
            },
          },
        },
        estado: {
          select: { nombre: true },
        },
      },
    });

    if (!ordenes) {
      return res.status(404).json({
        success: false,
        error: "No se encontraron ordenes de laboratorio para estem usuario",
      });
    }

    return res.status(200).json({ success: true, ordenes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "Error al obtener las ordenes de laboratorio",
    });
  }
};

const obtenerOrdenesLab = async (req, res) => {
  try {
    const ordenes = await prisma.ordenLaboratorio.findMany({
      select: {
        id: true,
        instrucciones: true,
        tipo_examen: true,
        created_at: true,
        resultado_url: true,
        expediente: {
          select: {
            paciente: {
              select: {
                grupo_sanguineo: true,
                usuario: {
                  select: {
                    primer_nombre: true,
                    segundo_nombre: true,
                    primer_apellido: true,
                    segundo_apellido: true,
                    cedula: true,
                    fecha_nacimiento: true,
                  },
                },
              },
            },
          },
        },
        estado: {
          select: { nombre: true },
        },
      },
    });

    if (!ordenes) {
      return res.status(404).json({
        success: false,
        error: "No se encontraron ordenes de laboratorio",
      });
    }

    return res.status(200).json({ success: true, ordenes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "Error al obtener las ordenes de laboratorio",
    });
  }
};

const uploadOrdenLab = async (req, res) => {
  const { orden_id } = req.params;
  const file = req.file;

  const id = parseInt(orden_id, 10);
  if (!file) {
    return res.status(400).json({ success: false, error: "Archivo requerido" });
  }

  try {
    const fileName = `${Date.now()}_${file.originalname}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("OrdenesLab")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      return res
        .status(400)
        .json({ success: false, error: uploadError.message });
    }

    const { data: urlData, error: urlError } = supabase.storage
      .from("OrdenesLab")
      .getPublicUrl(fileName);

    if (urlError) {
      return res.status(400).json({ success: false, error: urlError.message });
    }

    const updatedOrden = await prisma.ordenLaboratorio.update({
      where: { id: id },
      data: {
        estado_id: 11,
        resultado_url: urlData.publicUrl,
      },
      select: {
        tipo_examen: true,
        instrucciones: true,
        resultado_url: true,
        estado: {
          select: {
            nombre: true
          }
        }
      }
    });
    res.status(200).json({ success: true, orden: updatedOrden });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al subir archivo" });
  }
};

module.exports = {
  obtenerOrdenesLabPorId,
  obtenerOrdenesLab,
  uploadOrdenLab,
};
