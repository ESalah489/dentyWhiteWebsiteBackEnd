import Service from "../../../DB/models/service.model.js";
import Category from "../../../DB/models/serviceCategory.model.js";
import Doctor from "../../../DB/models/doctor.model.js";
import mongoose from "mongoose";

export const searchServices = async (req, res, next) => {
  try {
    const {
      keyword, 
      minPrice,
      maxPrice,
      sessions,
      sortBy,
      order = "desc",
      page = 1,
      limit = 12,
    } = req.validatedQuery;

    let filter = {};
    let sort = { createdAt: -1 };

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (sessions) {
      filter.sessions = { $regex: sessions, $options: "i" };
    }

    if (sortBy) {
      sort = {};
      sort[sortBy] = order === "asc" ? 1 : -1;
    }

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skip = (pageNum - 1) * limitNum;

    const services = await Service.find(filter)
      .populate("category", "name")
      .populate("doctors", "name specialization")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Service.countDocuments(filter);

    res.status(200).json({
      message: "Services search results",
      total,
      page: pageNum,
      results: services.length,
      services,
    });
  } catch (err) {
    next(err);
  }
};


export const searchDoctors = async (req, res, next) => {
  try {
    const {
      keyword,
      specialization,
      sortBy,
      order = "desc",
      page = 1,
      limit = 12,
    } = req.validatedQuery;

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skip = (pageNum - 1) * limitNum;

    const sortStage = {};
    if (sortBy) {
      sortStage[sortBy] = order === "asc" ? 1 : -1;
    } else {
      sortStage.createdAt = -1;
    }

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ];

    const matchStage = {};

    if (keyword) {
  const words = keyword.trim().split(" ");

  matchStage.$and = words.map((word) => ({
    $or: [
      { "user.firstName": { $regex: word, $options: "i" } },
      { "user.lastName": { $regex: word, $options: "i" } },
    ],
  }));
}


    if (specialization) {
      matchStage.specialization = {
        $regex: specialization,
        $options: "i",
      };
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    const totalDoctors = await Doctor.aggregate([...pipeline, { $count: "total" }]);
    const total = totalDoctors[0]?.total || 0;

    pipeline.push({ $sort: sortStage });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    const doctors = await Doctor.aggregate(pipeline);

    res.status(200).json({
      message: "Doctors search results",
      total,
      page: pageNum,
      results: doctors.length,
      doctors,
    });
  } catch (err) {
    next(err);
  }
};


/* ---------------------------- Search Suggestions ---------------------------- */
export const getDoctorSuggestions = async (req, res, next) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ message: "Keyword is required" });
    }

    const words = keyword.trim().split(/\s+/);

    const doctorNameConditions = words.map((word) => ({
      $or: [
        { "user.firstName": { $regex: word, $options: "i" } },
        { "user.lastName": { $regex: word, $options: "i" } },
      ],
    }));

    const doctors = await Doctor.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          $and: doctorNameConditions,
        },
      },
      {
        $project: {
          _id: 1,
          fullName: {
            $concat: ["$user.firstName", " ", "$user.lastName"],
          },
        },
      },
      { $limit: 5 },
    ]);

    res.status(200).json({
      doctors: doctors.map((d) => d.fullName),
    });
  } catch (err) {
    next(err);
  }
};

export const getServiceSuggestions = async (req, res, next) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ message: "Keyword is required" });
    }

    const words = keyword.trim().split(/\s+/);

    const serviceNameConditions = words.map((word) => ({
      name: { $regex: word, $options: "i" },
    }));

    const services = await Service.find({ $and: serviceNameConditions })
      .limit(5)
      .select("name");

    res.status(200).json({
      services: services.map((s) => s.name),
    });
  } catch (err) {
    next(err);
  }
};

