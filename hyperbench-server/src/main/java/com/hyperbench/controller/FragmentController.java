package com.hyperbench.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/fragments")
public class FragmentController {

    @GetMapping("/navigation")
    public String navigation() {
        return "fragments/navigation";
    }

    @GetMapping("/task-list")
    public String taskList() {
        return "fragments/task-list";
    }

    @GetMapping("/task-form")
    public String taskForm() {
        return "fragments/task-form";
    }

    @GetMapping("/task-form/{id}")
    public String taskFormEdit(@PathVariable Long id, Model model) {
        model.addAttribute("taskId", id);
        return "fragments/task-form";
    }
}
